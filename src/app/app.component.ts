import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileConverterComponent } from "./file-converter/file-converter.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FileConverterComponent, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fileConverter';
}
