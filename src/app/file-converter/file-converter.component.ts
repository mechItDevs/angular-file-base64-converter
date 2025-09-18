import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-file-converter',
  standalone: true,
  imports: [FormsModule, NgIf, JsonPipe],
  templateUrl: './file-converter.component.html',
  styleUrls: ['./file-converter.component.css']
})
export class FileConverterComponent {
  base64String: string | null = null;
  inputBase64: string = '';
  fileName: string = '';
  jsonInput: string = '';
  jsonPreview: any = null;

  // Convert file to Base64
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.base64String = result.split(',')[1];

      // If file is JSON → preview
      if (file.name.endsWith('.json')) {
        try {
          const decodedText = atob(this.base64String);
          this.jsonPreview = JSON.parse(decodedText);
        } catch {
          this.jsonPreview = null;
        }
      } else {
        this.jsonPreview = null;
      }
    };
    reader.readAsDataURL(file);
  }

  // Convert JSON text to Base64
  convertJsonToBase64() {
    try {
      const jsonStr = JSON.stringify(JSON.parse(this.jsonInput)); // validate JSON
      this.base64String = btoa(jsonStr);
      this.jsonPreview = JSON.parse(this.jsonInput);
    } catch {
      alert("Invalid JSON input!");
    }
  }

  // Convert Base64 back to File
  downloadFile() {
    if (!this.inputBase64 || !this.fileName) {
      alert("Please provide Base64 string and file name with extension");
      return;
    }

    const byteCharacters = atob(this.inputBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = this.fileName;
    link.click();

    // If JSON, show preview
    if (this.fileName.endsWith('.json')) {
      try {
        this.jsonPreview = JSON.parse(new TextDecoder().decode(byteArray));
      } catch {
        this.jsonPreview = null;
      }
    }
  }

  // Copy Base64 string to clipboard
  copyBase64() {
    if (this.base64String) {
      navigator.clipboard.writeText(this.base64String);
      alert("Base64 copied to clipboard!");
    }
  }
}
