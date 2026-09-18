import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileConverterComponent } from './file-converter.component';

describe('FileConverterComponent', () => {
  let component: FileConverterComponent;
  let fixture: ComponentFixture<FileConverterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileConverterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileConverterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should offer the correct destination types for each source', () => {
    component.fromType = 'xlsx';
    component.onFromTypeChange();
    expect(component.toOptions).toEqual(['json', 'base64']);

    component.fromType = 'json';
    component.onFromTypeChange();
    expect(component.toOptions).toEqual(['xlsx', 'base64']);

    component.fromType = 'pdf';
    component.onFromTypeChange();
    expect(component.toOptions).toEqual(['base64']);

    component.fromType = 'zip';
    component.onFromTypeChange();
    expect(component.toOptions).toEqual(['base64']);
  });

  it('should allow JSON to be supplied as pasted text', () => {
    component.fromType = 'json';
    component.onFromTypeChange();
    component.toType = 'base64';
    component.setJsonInputMode('text');
    component.inputText = '{"name":"Ada"}';

    expect(component.jsonInputMode).toBe('text');
    expect(component.canConvert()).toBeTrue();
  });
});
