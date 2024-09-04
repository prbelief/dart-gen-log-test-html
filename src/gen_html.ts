import * as fs from 'fs';
import path from 'path';

export async function genHtml(logContent: string, outputFilePath: string) {
    // ตัวแปรสำหรับการนับการทดสอบ
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    const bodyContent: string[] = [];

    let isError = false;
    let isRenderingException = false;
    let errorBody = '';
    let testName = '';

    const lines = logContent.split('\n');

    for (const line of lines) {
        if (line.trim() === '') continue; // ข้ามบรรทัดว่าง

        // ตรวจจับค่าสุดท้ายของการทดสอบที่ผ่านและล้มเหลว
        const testStatusMatch = line.match(/\d{2}:\d{2} \+(\d+)( -(\d+))?/);
        if (testStatusMatch) {
            passedTests = parseInt(testStatusMatch[1]); // จำนวนการทดสอบที่ผ่าน
            failedTests = testStatusMatch[3] ? parseInt(testStatusMatch[3]) : 0; // จำนวนการทดสอบที่ล้มเหลว
            totalTests = passedTests + failedTests; // รวมจำนวนการทดสอบทั้งหมด
        }

        // ตรวจจับข้อผิดพลาดที่เริ่มต้นด้วย "══╡ EXCEPTION CAUGHT BY RENDERING LIBRARY ╞"
        if (line.includes('══╡ EXCEPTION CAUGHT BY RENDERING LIBRARY ╞')) {
            isRenderingException = true;
            errorBody = ''; // ล้างข้อความก่อนหน้า
            errorBody += line + '\n';
            continue;
        }

        // ตรวจจับข้อผิดพลาดที่มี "[E]"
        if (line.includes('[E]')) {
            // แยกชื่อการทดสอบจากบรรทัดที่มี [E]
            const errorStartIndex = line.indexOf(':') + 1;
            const errorEndIndex = line.indexOf('[E]');
            testName = line.substring(errorStartIndex, errorEndIndex).trim();
            isError = true;
            errorBody = ''; // ล้างข้อความก่อนหน้า
            continue;
        }

        // ถ้าอยู่ในโหมด error หรือ rendering exception ให้สะสมข้อความ
        if (isError || isRenderingException) {
            errorBody += line + '\n';

            // เมื่อเจอบรรทัดที่เริ่มต้นด้วย 'To run this test again:' หรือบรรทัดที่มีการแบ่งเส้น ═ ให้สิ้นสุดการสะสม
            if (line.startsWith('To run this test again:') || line.includes('════════════════════════════════════════════════════════════════════════════════════════════════════')) {
                if (isError) {
                    bodyContent.push(`<tr><td class="error">Error</td><td><span class="test-name">Test Name:</span> ${testName}<br/><pre>${errorBody}</pre></td></tr>`);
                    isError = false;
                }
                if (isRenderingException) {
                    bodyContent.push(`<tr><td class="error">Rendering Exception</td><td><pre>${errorBody}</pre></td></tr>`);
                    isRenderingException = false;
                }
            }
        }
    }

    // ถ้า error หรือ rendering exception ยังไม่ถูกเขียนออกมาในตอนท้าย ให้เขียนออกมา
    if (isError) {
        bodyContent.push(`<tr><td class="error">Error</td><td><span class="test-name">Test Name:</span> ${testName}<br/><pre>${errorBody}</pre></td></tr>`);
    }
    if (isRenderingException) {
        bodyContent.push(`<tr><td class="error">Rendering Exception</td><td><pre>${errorBody}</pre></td></tr>`);
    }

    // อ่าน log file และสร้าง HTML
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Test Results</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; margin: 0; padding: 20px; }
            h1 { color: #4CAF50; }
            .summary { margin-bottom: 20px; }
            .summary div { margin-bottom: 5px; }
            .summary .total { font-weight: bold; }
            .summary .passed { color: #4CAF50; font-weight: bold; }
            .summary .failed { color: #F44336; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ccc; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .error { color: #F44336; font-weight: bold; }
            .test-name { font-weight: bold; }
            pre { background-color: #eee; padding: 10px; border: 1px solid #ddd; }
        </style>
    </head>
    <body>
        <h1>Test Results</h1>
        <div class="summary">
            <div class="total">Total Tests: <span id="total-tests">${totalTests}</span></div>
            <div class="passed">Passed Tests: <span id="passed-tests">${passedTests}</span></div>
            <div class="failed">Failed Tests: <span id="failed-tests">${failedTests}</span></div>
        </div>
        <table>
            <tr><th>Type</th><th>Details</th></tr>
            ${bodyContent.join('\n')}
        </table>
    </body>
    </html>
    `;

    // สร้างไฟล์ HTML
    fs.writeFile(outputFilePath, htmlContent, (err) => {
        if (err) {
            console.error("Error writing file:", err);
        } else {
            console.log("File written successfully!");
        }
    });

    console.log('Log summary has been written to report-test.html');
}
