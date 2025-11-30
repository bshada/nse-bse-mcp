import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { promisify } from 'util';
import { exec } from 'child_process';
import { URL } from 'url';
import { formatLimitedResponse } from '../utils/response-limiter.js';

const execAsync = promisify(exec);

interface DownloadResult {
  success: boolean;
  content?: string;
  files?: string[];
  error?: string;
  metadata?: {
    filename: string;
    size: number;
    type: string;
    pages?: number;
    extractedPages?: string;
  };
}

interface PageOptions {
  startPage?: number;
  endPage?: number;
  pages?: number[];
}

export async function handleDocumentTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  try {
    if (name === 'download_document') {
      const result = await downloadAndExtract(
        args.url,
        args.max_size_mb || 50,
        {
          startPage: args.start_page,
          endPage: args.end_page,
          pages: args.pages,
        }
      );

      // Document content is already limited by page selection
      // Just format it properly
      return formatLimitedResponse(result);
    }

    if (name === 'read_document_pages') {
      const result = await readDocumentPages(
        args.filename,
        args.url,
        {
          startPage: args.start_page,
          endPage: args.end_page,
          pages: args.pages,
        },
        args.max_size_mb || 50
      );

      // Document content is already limited by page selection
      return formatLimitedResponse(result);
    }

    throw new Error(`Unknown document tool: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function downloadAndExtract(
  url: string,
  maxSizeMB: number,
  pageOptions?: PageOptions
): Promise<DownloadResult> {
  const downloadDir = path.join(process.cwd(), 'downloads', 'documents');

  // Create downloads directory if it doesn't exist
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  try {
    // Parse URL and get filename
    const urlObj = new URL(url);
    const filename = path.basename(urlObj.pathname) || 'document';
    const filepath = path.join(downloadDir, filename);

    // Check if file already exists
    let fileExists = false;
    let stats: fs.Stats;

    if (fs.existsSync(filepath)) {
      stats = fs.statSync(filepath);
      fileExists = true;
      console.log(`File already exists: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB) - Skipping download`);
    } else {
      // Download file
      console.log(`Downloading: ${url}`);
      await downloadFile(url, filepath, maxSizeMB);
      stats = fs.statSync(filepath);
      console.log(`Downloaded: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }

    const ext = path.extname(filename).toLowerCase();

    console.log(`Downloaded: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Handle different file types
    if (ext === '.pdf') {
      // Extract text from PDF
      const result = await extractPdfText(filepath, pageOptions);
      return {
        success: true,
        content: result.text + (fileExists ? '\n\n[Note: Used cached file - already downloaded]' : ''),
        metadata: {
          filename,
          size: stats.size,
          type: 'pdf',
          pages: result.totalPages,
          extractedPages: result.extractedPages,
        },
      };
    } else if (ext === '.zip') {
      // Extract ZIP and read contents
      const extractPath = path.join(
        downloadDir,
        path.basename(filepath, '.zip') + '_extracted'
      );

      let extractedFiles: string[];

      // Check if already extracted
      if (fs.existsSync(extractPath) && fs.readdirSync(extractPath).length > 0) {
        console.log(`Using cached extraction: ${path.basename(extractPath)}`);
        extractedFiles = getAllFiles(extractPath);
      } else {
        console.log(`Extracting ZIP: ${filename}`);
        extractedFiles = await extractZip(filepath, downloadDir);
      }

      const contents = await readExtractedFiles(extractedFiles);
      return {
        success: true,
        content: contents + (fileExists ? '\n\n[Note: Used cached file - already downloaded]' : ''),
        files: extractedFiles,
        metadata: {
          filename,
          size: stats.size,
          type: 'zip',
        },
      };
    } else if (['.txt', '.csv', '.json', '.xml', '.html'].includes(ext)) {
      // Read text-based files directly
      const content = fs.readFileSync(filepath, 'utf-8');
      return {
        success: true,
        content: content + (fileExists ? '\n\n[Note: Used cached file - already downloaded]' : ''),
        metadata: {
          filename,
          size: stats.size,
          type: 'text',
        },
      };
    } else {
      return {
        success: false,
        error: `Unsupported file type: ${ext}. Supported: .pdf, .zip, .txt, .csv, .json, .xml, .html`,
        metadata: {
          filename,
          size: stats.size,
          type: 'unknown',
        },
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function downloadFile(
  url: string,
  filepath: string,
  maxSizeMB: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const maxBytes = maxSizeMB * 1024 * 1024;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, filepath, maxSizeMB)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      // Check file size
      const contentLength = parseInt(response.headers['content-length'] || '0');
      if (contentLength > maxBytes) {
        reject(
          new Error(
            `File too large: ${(contentLength / 1024 / 1024).toFixed(2)} MB (max: ${maxSizeMB} MB)`
          )
        );
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes > maxBytes) {
          fileStream.close();
          fs.unlinkSync(filepath);
          reject(new Error(`File exceeded size limit during download`));
        }
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function extractPdfText(filepath: string, pageOptions?: PageOptions): Promise<{
  text: string;
  totalPages: number;
  extractedPages: string;
}> {
  try {
    // Use pdf-parse library (works cross-platform)
    // Dynamic import to handle ESM module
    const { PDFParse } = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filepath);

    // Create parser with data buffer
    const parser = new PDFParse({ data: dataBuffer });

    // Extract text
    const textResult = await parser.getText();
    const totalPages = textResult.pages.length;

    let extractedText = '';
    let extractedPages = '';

    if (pageOptions) {
      // Handle specific pages array
      if (pageOptions.pages && pageOptions.pages.length > 0) {
        const validPages = pageOptions.pages.filter(p => p >= 1 && p <= totalPages);
        extractedPages = validPages.join(', ');

        for (const pageNum of validPages) {
          const pageIndex = pageNum - 1; // Convert to 0-based
          if (textResult.pages[pageIndex]) {
            extractedText += `\n\n--- PAGE ${pageNum} ---\n\n`;
            extractedText += textResult.pages[pageIndex].text;
          }
        }
      }
      // Handle page range
      else if (pageOptions.startPage || pageOptions.endPage) {
        const startPage = Math.max(1, pageOptions.startPage || 1);
        const endPage = Math.min(totalPages, pageOptions.endPage || totalPages);
        extractedPages = `${startPage}-${endPage}`;

        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          const pageIndex = pageNum - 1; // Convert to 0-based
          if (textResult.pages[pageIndex]) {
            extractedText += `\n\n--- PAGE ${pageNum} ---\n\n`;
            extractedText += textResult.pages[pageIndex].text;
          }
        }
      }
      else {
        // No valid page options, extract all
        extractedText = textResult.text;
        extractedPages = `1-${totalPages}`;
      }
    } else {
      // No page options, extract all
      extractedText = textResult.text;
      extractedPages = `1-${totalPages}`;
    }

    // Build result with metadata
    const result = `PDF: ${path.basename(filepath)}\n`;
    const metadata = `Total Pages: ${totalPages} | Extracted Pages: ${extractedPages} | Text Length: ${extractedText.length} characters\n\n`;
    const separator = '='.repeat(80) + '\n';

    return {
      text: result + metadata + separator + extractedText,
      totalPages,
      extractedPages,
    };
  } catch (error: any) {
    // Fallback: return error info
    return {
      text: `PDF file: ${path.basename(filepath)}\n\nError extracting text: ${error.message}\n\nFile location: ${filepath}`,
      totalPages: 0,
      extractedPages: 'error',
    };
  }
}

async function extractZip(zipPath: string, extractDir: string): Promise<string[]> {
  const extractPath = path.join(
    extractDir,
    path.basename(zipPath, '.zip') + '_extracted'
  );

  // Create extraction directory
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  try {
    // Try using unzip command (available on most systems)
    await execAsync(`unzip -o "${zipPath}" -d "${extractPath}"`);
  } catch (error) {
    // Fallback: try using PowerShell on Windows
    try {
      await execAsync(
        `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`
      );
    } catch (psError) {
      throw new Error(
        'ZIP extraction failed. Please install unzip or use Windows with PowerShell.'
      );
    }
  }

  // Get list of extracted files
  const files = getAllFiles(extractPath);
  return files;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function readExtractedFiles(files: string[]): Promise<string> {
  let content = `Extracted ${files.length} file(s):\n\n`;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const filename = path.basename(file);

    content += `\n${'='.repeat(80)}\n`;
    content += `File: ${filename}\n`;
    content += `${'='.repeat(80)}\n\n`;

    if (['.txt', '.csv', '.json', '.xml', '.html', '.md'].includes(ext)) {
      try {
        const fileContent = fs.readFileSync(file, 'utf-8');
        // Limit content size per file
        if (fileContent.length > 50000) {
          content += fileContent.substring(0, 50000) + '\n\n[Content truncated - file too large]\n';
        } else {
          content += fileContent + '\n';
        }
      } catch (error) {
        content += `[Error reading file: ${error}]\n`;
      }
    } else if (ext === '.pdf') {
      try {
        const pdfResult = await extractPdfText(file);
        if (pdfResult.text.length > 50000) {
          content += pdfResult.text.substring(0, 50000) + '\n\n[Content truncated - file too large]\n';
        } else {
          content += pdfResult.text + '\n';
        }
      } catch (error) {
        content += `[PDF file - text extraction not available]\n`;
      }
    } else {
      content += `[Binary file - ${ext}]\n`;
    }
  }

  return content;
}

async function readDocumentPages(
  filename: string | undefined,
  url: string | undefined,
  pageOptions: PageOptions,
  maxSizeMB: number
): Promise<DownloadResult> {
  const downloadDir = path.join(process.cwd(), 'downloads', 'documents');

  try {
    let filepath: string | null = null;

    // Case 1: Filename provided - check if it exists in cache
    if (filename) {
      // First try direct path
      const directPath = path.join(downloadDir, filename);

      if (fs.existsSync(directPath)) {
        filepath = directPath;
        console.log(`Using cached file: ${filename}`);
      } else {
        // Search recursively in subdirectories
        console.log(`Searching for file: ${filename} in subdirectories...`);
        const foundFiles = getAllFiles(downloadDir).filter(f => path.basename(f) === filename);

        if (foundFiles.length > 0) {
          filepath = foundFiles[0];
          console.log(`Found cached file: ${filepath}`);
        } else if (url) {
          // File not in cache, download from URL
          console.log(`File not cached, downloading from: ${url}`);
          filepath = directPath;
          await downloadFile(url, filepath, maxSizeMB);
          console.log(`Downloaded: ${filename}`);
        } else {
          return {
            success: false,
            error: `File not found in cache: ${filename}. Please provide a URL to download it.`,
          };
        }
      }
    }
    // Case 2: Only URL provided - download it
    else if (url) {
      const urlObj = new URL(url);
      const urlFilename = path.basename(urlObj.pathname) || 'document';
      filepath = path.join(downloadDir, urlFilename);

      if (!fs.existsSync(filepath)) {
        console.log(`Downloading from: ${url}`);
        await downloadFile(url, filepath, maxSizeMB);
        console.log(`Downloaded: ${urlFilename}`);
      } else {
        console.log(`Using cached file: ${urlFilename}`);
      }
    }
    // Case 3: Neither provided
    else {
      return {
        success: false,
        error: 'Either filename or url must be provided',
      };
    }

    if (!filepath) {
      return {
        success: false,
        error: 'Could not determine file path',
      };
    }

    // Check if it's a PDF
    const ext = path.extname(filepath).toLowerCase();
    if (ext !== '.pdf') {
      return {
        success: false,
        error: `This tool only supports PDF files. File type: ${ext}`,
      };
    }

    // Extract the requested pages
    const stats = fs.statSync(filepath);
    const result = await extractPdfText(filepath, pageOptions);

    return {
      success: true,
      content: result.text,
      metadata: {
        filename: path.basename(filepath),
        size: stats.size,
        type: 'pdf',
        pages: result.totalPages,
        extractedPages: result.extractedPages,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
