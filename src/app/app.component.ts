import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileConverterComponent } from "./file-converter/file-converter.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FileConverterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fileConverter';
}
