import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-converter',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './file-converter.component.html',
  styleUrls: ['./file-converter.component.css']
})
export class FileConverterComponent {
  fromType = '';
  toType = '';
  fromOptions = ['xlsx', 'pdf', 'zip', 'json', 'base64'];
  toOptions: string[] = [];

  selectedFile: File | null = null;
  selectedFileName = '';
  selectedFileSizeText = '';
  outputText = '';
  outputName = '';
  validationError = '';
  lastMessage = '';
  menuOpen = false;
  showOutputTextarea = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  resetPage() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedFileSizeText = '';
    this.outputText = '';
    this.outputName = '';
    this.validationError = '';
    this.lastMessage = '';
    this.showOutputTextarea = false;
    this.toType = '';
  }

  onFromTypeChange() {
    this.resetPage();
    switch (this.fromType) {
      case 'xlsx':
        this.toOptions = ['base64', 'json'];
        break;
      case 'pdf':
      case 'zip':
      case 'json':
        this.toOptions = ['base64'];
        break;
      case 'base64':
        this.toOptions = ['xlsx', 'pdf', 'zip', 'json'];
        break;
      default:
        this.toOptions = [];
    }
  }

  allowedExtensions(type: string): string[] {
    const map: any = {
      xlsx: ['.xlsx'],
      pdf: ['.pdf'],
      zip: ['.zip'],
      json: ['.json']
    };
    return map[type] || [];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const allowed = this.allowedExtensions(this.fromType);
    if (allowed.length && !allowed.some(ext => file.name.endsWith(ext))) {
      this.validationError = `Invalid file type. Please select ${allowed.join(', ')}`;
      return;
    }

    this.validationError = '';
    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.selectedFileSizeText = (file.size / 1024).toFixed(2) + ' KB';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      const mockEvent = { target: { files: [file] } };
      this.onFileSelected(mockEvent);
    }
  }

  canConvert(): boolean {
    console.log('inside canConvert');

    if (this.fromType === 'base64') {
    console.log('inside canConvert base64');

      return !!this.outputText && !!this.toType && !!this.outputName;
    }
    return !!this.selectedFile && !!this.toType && !!this.outputName;
  }

  async onConvert() {
    console.log('inside OnConvert');
    
    this.lastMessage = '';
    this.validationError = '';

    console.log('this.canConvert(), ',this.canConvert());
    
    if (!this.canConvert()) {
    console.log('inside If ');

      this.validationError = 'Please fill all fields.';
      return;
    }

    // File → Base64 / JSON
    if (this.fromType !== 'base64' && this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (this.toType === 'base64') {
          this.outputText = base64;
          this.showOutputTextarea = true;
          this.lastMessage = 'Converted successfully to Base64!';
        } else if (this.toType === 'json') {
          this.outputText = JSON.stringify({
            fileName: this.selectedFileName,
            data: base64
          });
          this.showOutputTextarea = true;
          this.lastMessage = 'Converted successfully to JSON!';
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }

    // Base64 → File
    else if (this.fromType === 'base64') {
      try {
        let cleanBase64 = this.outputText.trim();
        if (cleanBase64.startsWith('data:')) {
          const parts = cleanBase64.split(',');
          cleanBase64 = parts.length > 1 ? parts[1] : parts[0];
        }

        const mimeType = this.getMimeType(this.toType);
        const blob = this.base64ToBlob(cleanBase64, mimeType);
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.outputName}.${this.toType}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.lastMessage = `File downloaded successfully as ${this.outputName}.${this.toType}`;
      } catch (err) {
        console.error(err);
        this.lastMessage = 'Invalid Base64 data.';
      }
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const sliceSize = 1024;
    const byteChars = atob(base64);
    const byteArrays: BlobPart[] = [];

    for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
      const slice = byteChars.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  private getMimeType(ext: string): string {
    const map: any = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      zip: 'application/zip',
      json: 'application/json'
    };
    return map[ext] || 'application/octet-stream';
  }

  copyOutputText() {
    if (this.outputText) {
      navigator.clipboard.writeText(this.outputText);
      this.lastMessage = 'Output copied to clipboard!';
    }
  }
}
