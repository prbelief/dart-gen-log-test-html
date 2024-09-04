import * as vscode from 'vscode';
import { genHtml } from './gen_html';
import path from 'path';


export function activate(context: vscode.ExtensionContext) {
	 let disposable = vscode.commands.registerCommand('dart-gen-log-test-html.generateToHtml', (uri: vscode.Uri) => {
        vscode.window.showInformationMessage(`Generate to HTML for: ${uri.fsPath}`);
        // ตัวอย่างเพิ่มเติม: อ่านเนื้อหาของไฟล์และแสดงผล
        vscode.workspace.openTextDocument(uri).then(async document => {
            const fileContent = document.getText();
			const directoryPath = path.dirname(uri.fsPath);
    		const fileOutPath = path.join(directoryPath, 'report-test.html');
			await genHtml(fileContent, fileOutPath);

			
			vscode.window.showInformationMessage(`Output to HTML for: ${fileOutPath}`);
        });
		
    });

	context.subscriptions.push(disposable);
}


export function deactivate() {}
