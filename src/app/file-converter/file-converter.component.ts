import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type FileType = 'xlsx' | 'pdf' | 'zip' | 'json' | 'base64';

@Component({ selector: 'app-file-converter', standalone: true, imports: [FormsModule, CommonModule], templateUrl: './file-converter.component.html', styleUrls: ['./file-converter.component.css'] })
export class FileConverterComponent {
  fromType = ''; toType = ''; readonly fromOptions: FileType[] = ['xlsx', 'pdf', 'zip', 'json', 'base64']; toOptions: FileType[] = [];
  selectedFile: File | null = null; selectedFileName = ''; selectedFileSizeText = ''; inputText = ''; outputText = ''; outputName = ''; validationError = ''; lastMessage = ''; menuOpen = false; showOutputTextarea = false; isDragging = false;
  jsonInputMode: 'file' | 'text' = 'file';

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  resetPage(): void { this.selectedFile = null; this.selectedFileName = ''; this.selectedFileSizeText = ''; this.inputText = ''; this.outputText = ''; this.outputName = ''; this.validationError = ''; this.lastMessage = ''; this.showOutputTextarea = false; this.toType = ''; this.isDragging = false; }
  onFromTypeChange(): void {
    this.resetPage();
    const conversions: Record<string, FileType[]> = {
      xlsx: ['json', 'base64'],
      pdf: ['base64'],
      zip: ['base64'],
      json: ['xlsx', 'base64'],
      base64: ['xlsx', 'pdf', 'zip', 'json']
    };
    this.toOptions = conversions[this.fromType] ?? [];
  }
  setJsonInputMode(mode: 'file' | 'text'): void {
    this.jsonInputMode = mode;
    this.validationError = '';
    this.lastMessage = '';
  }
  allowedExtensions(type: string): string[] { return ({ xlsx: ['.xlsx'], pdf: ['.pdf'], zip: ['.zip'], json: ['.json'] } as Record<string, string[]>)[type] ?? []; }

  onFileSelected(event: Event | { target: { files: File[] | FileList } }): void {
    const input = event.target as HTMLInputElement | { files: File[] | FileList } | null;
    const file = input?.files?.[0]; if (!file) return;
    const allowed = this.allowedExtensions(this.fromType);
    if (allowed.length && !allowed.some(ext => file.name.toLowerCase().endsWith(ext))) { this.validationError = `Invalid file type. Please select a ${allowed.join(' or ')} file.`; this.selectedFile = null; return; }
    this.validationError = ''; this.lastMessage = ''; this.selectedFile = file; this.selectedFileName = file.name; this.selectedFileSizeText = this.formatFileSize(file.size);
  }
  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging = true; }
  onDragLeave(): void { this.isDragging = false; }
  onDrop(event: DragEvent): void { event.preventDefault(); this.isDragging = false; const file = event.dataTransfer?.files[0]; if (file) this.onFileSelected({ target: { files: [file] } }); }
  canConvert(): boolean {
    if (this.fromType === 'base64') return Boolean(this.inputText.trim() && this.toType && this.outputName.trim());
    if (this.fromType === 'json' && this.jsonInputMode === 'text') return Boolean(this.inputText.trim() && this.toType);
    return Boolean(this.selectedFile && this.toType);
  }

  async onConvert(): Promise<void> {
    this.lastMessage = ''; this.validationError = '';
    if (!this.canConvert()) { this.validationError = this.fromType === 'base64' ? 'Paste Base64 data, choose an output type, and enter a file name.' : this.fromType === 'json' && this.jsonInputMode === 'text' ? 'Paste JSON data and choose an output type.' : 'Choose a file and an output type.'; return; }

    try {
      if (this.fromType === 'base64') {
        this.downloadBase64File();
        return;
      }

      if (!this.selectedFile) {
        throw new Error('Please upload a file before converting.');
      }

      switch (this.fromType) {
        case 'xlsx':
          if (this.toType === 'json') {
            await this.convertSpreadsheetToJson(this.selectedFile);
            return;
          }
          if (this.toType === 'base64') {
            this.outputText = await this.fileToBase64(this.selectedFile);
            this.showOutputTextarea = true;
            this.lastMessage = 'Converted successfully to Base64. Copy the output below.';
            return;
          }
          throw new Error('Unsupported XLSX conversion.');

        case 'json':
          const jsonContent = this.jsonInputMode === 'text' ? this.inputText : await this.selectedFile!.text();
          JSON.parse(jsonContent);
          if (this.toType === 'xlsx') {
            await this.convertJsonToXlsx(jsonContent, this.jsonInputMode === 'text' ? 'json-data' : this.selectedFileName);
            return;
          }
          if (this.toType === 'base64') {
            this.outputText = await this.fileToBase64(new Blob([jsonContent], { type: 'application/json' }));
            this.showOutputTextarea = true;
            this.lastMessage = 'Converted successfully to Base64. Copy the output below.';
            return;
          }
          throw new Error('Unsupported JSON conversion.');

        case 'pdf':
        case 'zip':
          if (this.toType === 'base64') {
            this.outputText = await this.fileToBase64(this.selectedFile);
            this.showOutputTextarea = true;
            this.lastMessage = 'Converted successfully to Base64. Copy the output below.';
            return;
          }
          throw new Error('Only Base64 conversion is supported for this file type.');

        default:
          throw new Error('Unsupported file type selected.');
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      this.validationError = error instanceof Error ? error.message : 'The file could not be converted.';
    }
  }
  copyOutputText(): void { if (!this.outputText) return; if (!navigator.clipboard) { this.validationError = 'Could not access the clipboard. Select and copy the output manually.'; return; } navigator.clipboard.writeText(this.outputText).then(() => this.lastMessage = 'Output copied to clipboard.').catch(() => this.validationError = 'Could not access the clipboard. Select and copy the output manually.'); }
  downloadOutput(): void { if (!this.outputText) return; this.downloadBlob(new Blob([this.outputText], { type: 'application/json' }), `${this.safeFileName(this.outputName || 'converted-file')}.json`); this.lastMessage = 'Output downloaded.'; }

  private async convertSpreadsheetToJson(file: File): Promise<void> {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheets = Object.fromEntries(
      workbook.SheetNames.map(name => [name, XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: null })])
    );
    this.outputText = JSON.stringify(sheets, null, 2);
    this.showOutputTextarea = true;
    this.lastMessage = 'Spreadsheet converted to JSON. Copy or download the result below.';
  }

  private async convertJsonToXlsx(text: string, sourceName: string): Promise<void> {
    const XLSX = await import('xlsx');
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null
        ? Object.entries(parsed).map(([key, value]) => ({ key, value }))
        : [{ value: parsed }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const outputName = `${this.safeFileName((sourceName || 'converted-file').replace(/\.[^/.]+$/, ''))}.xlsx`;
    this.downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), outputName);
    this.showOutputTextarea = false;
    this.lastMessage = `Downloaded ${outputName}.`;
  }

  private async fileToBase64(file: Blob): Promise<string> { const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The file could not be read.')); reader.readAsDataURL(file); }); return dataUrl.split(',', 2)[1] ?? ''; }
  private downloadBase64File(): void { const base64 = this.normaliseBase64(this.inputText); if (!base64) throw new Error('Enter valid Base64 data.'); const data = Uint8Array.from(atob(base64), char => char.charCodeAt(0)); const extension = this.toType as FileType; const filename = `${this.safeFileName(this.outputName)}.${extension}`; this.downloadBlob(new Blob([data], { type: this.getMimeType(extension) }), filename); this.lastMessage = `Downloaded ${filename}.`; }
  private normaliseBase64(value: string): string { const content = value.trim().replace(/^data:[^,]+,/i, '').replace(/\s/g, ''); return content && /^[A-Za-z0-9+/]*={0,2}$/.test(content) && content.length % 4 === 0 ? content : ''; }
  private downloadBlob(blob: Blob, filename: string): void { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
  private safeFileName(name: string): string { return name.trim().replace(/[\\/:*?"<>|]/g, '-') || 'converted-file'; }
  private formatFileSize(bytes: number): string { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
  private getMimeType(type: FileType): string { return ({ pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip', json: 'application/json' } as Partial<Record<FileType, string>>)[type] ?? 'application/octet-stream'; }
}
