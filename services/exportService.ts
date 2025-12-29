import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getAllStudents } from './studentService';
import { Student } from '../types';

export const exportAcademyDataToExcel = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const rawStudents = await getAllStudents();
        if (!rawStudents || rawStudents.length === 0) {
            return { success: false, error: 'No student data found to export.' };
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const now = new Date();
        const curYear = String(now.getFullYear());
        const curMonth = String(now.getMonth() + 1).padStart(2, '0');
        const curMonthLabel = monthNames[now.getMonth()];
        const monthYearPrefix = `${curYear}-${curMonth}`;

        // 1. Sort students for the Master Directory
        const students = [...rawStudents].sort((a, b) => {
            if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
            if (a.session !== b.session) return a.session.localeCompare(b.session);
            if (a.sessionTimings !== b.sessionTimings) return a.sessionTimings.localeCompare(b.sessionTimings);
            return a.fullName.localeCompare(b.fullName);
        });

        const wb = XLSX.utils.book_new();

        // 2. MASTER SHEET: All Students Master
        const masterRows: any[] = [];
        let lastBranchMaster = '';
        let lastTimingMaster = '';
        students.forEach((s) => {
            if (lastBranchMaster && s.branch !== lastBranchMaster) {
                masterRows.push({}); masterRows.push({});
            } else if (lastTimingMaster && s.sessionTimings !== lastTimingMaster) {
                masterRows.push({});
            }
            masterRows.push({
                'Stadium': s.branch,
                'Batch': s.session,
                'Timings': s.sessionTimings,
                'Student Name': s.fullName,
                'Phone Number': s.phoneNumber,
                'Monthly Fee (₹)': s.sessionFee,
                'Joining Date': s.joiningDate || new Date(s.createdAt).toLocaleDateString(),
                'Address': s.address
            });
            lastBranchMaster = s.branch;
            lastTimingMaster = s.sessionTimings;
        });
        const wsMaster = XLSX.utils.json_to_sheet(masterRows);
        wsMaster['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsMaster, 'All Students Master');

        // 3. MASTER SHEET: All Fee Payments (With "Absent" for missing records)
        const systemMonths = new Set<string>();
        students.forEach(s => {
            if (s.feeHistory) s.feeHistory.forEach(f => systemMonths.add(`${f.month} ${f.year}`));
        });
        const sortedSystemMonths = Array.from(systemMonths).sort((a, b) => {
            const [mA, yA] = a.split(' ');
            const [mB, yB] = b.split(' ');
            if (yA !== yB) return yB.localeCompare(yA);
            return monthNames.indexOf(mB) - monthNames.indexOf(mA);
        });

        const allFees: any[] = [];
        sortedSystemMonths.forEach(monthYear => {
            const [monthNum, year] = monthYear.split(' ');
            const monthLabel = monthNames[parseInt(monthNum, 10) - 1];
            let recordsInMonth = 0;

            students.forEach(s => {
                const record = s.feeHistory?.find(f => f.month === monthNum && f.year === year);
                if (record || s.joiningDate) {
                    allFees.push({
                        'Stadium': s.branch,
                        'Student Name': s.fullName,
                        'Month': monthLabel,
                        'Year': year,
                        'Amount (₹)': record?.amount || s.sessionFee || 0,
                        'Status': record?.status || 'ABSENT',
                        'Payment Date': record?.paidDate ? new Date(record.paidDate).toLocaleDateString() : '-'
                    });
                    recordsInMonth++;
                }
            });
            if (recordsInMonth > 0) allFees.push({});
        });
        if (allFees.length > 0) {
            const wsAllFees = XLSX.utils.json_to_sheet(allFees);
            wsAllFees['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, wsAllFees, 'All Fee Payments History');
        }

        // 4. BATCH-SPECIFIC SHEETS: Attendance Register + Current Month Fees
        const batchGroups: { [key: string]: Student[] } = {};
        students.forEach(s => {
            const key = `${s.branch} - ${s.session}`;
            if (!batchGroups[key]) batchGroups[key] = [];
            batchGroups[key].push(s);
        });

        const usedSheetNames = new Set<string>(['All Students Master', 'All Fee Payments History']);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        Object.keys(batchGroups).forEach(batchKey => {
            const batchStudents = batchGroups[batchKey];
            const logRows: any[] = [];

            // Add Header for Context
            logRows.push({ 'Student Name': `BATCH REGISTER: ${batchKey} (${curMonthLabel} ${curYear})` });
            logRows.push({}); // Space

            // Prepare Table
            batchStudents.forEach(s => {
                // Find if anyone marked fees for this month
                const feeRec = s.feeHistory?.find(f => f.month === curMonth && f.year === curYear);

                const row: any = {
                    'Student Name': s.fullName,
                    'Phone Number': s.phoneNumber,
                    [`Fees (${curMonthLabel})`]: feeRec?.status === 'Paid' ? 'PAID' : 'PENDING',
                    'Fee Processed By': feeRec?.markedByName || '-'
                };

                // Fill actual history for current month
                for (let d = 1; d <= daysInMonth; d++) {
                    const dayKey = d < 10 ? `0${d}` : `${d}`;
                    const targetDate = `${curYear}-${curMonth}-${dayKey}`;
                    const record = s.attendanceHistory?.find(h => h.date === targetDate);
                    const statusText = record ? (record.status === 'Present' ? 'P' : 'A') : '-';
                    const processedBy = record?.markedByName ? ` (${record.markedByName})` : '';
                    row[dayKey] = record ? statusText + processedBy : '-';
                }
                logRows.push(row);
            });

            const wsBatch = XLSX.utils.json_to_sheet(logRows);

            // Column Widths for Batch Sheets (Narrower for days, wider if showing names)
            const batchCols = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
            for (let i = 1; i <= daysInMonth; i++) batchCols.push({ wch: 12 });
            wsBatch['!cols'] = batchCols;

            let finalName = `Log - ${batchKey}`.substring(0, 31).trim();
            let counter = 1;
            while (usedSheetNames.has(finalName)) {
                counter++;
                finalName = `Log - ${batchKey}`.substring(0, 31 - ` (${counter})`.length) + ` (${counter})`;
            }
            usedSheetNames.add(finalName);
            XLSX.utils.book_append_sheet(wb, wsBatch, finalName);
        });

        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fs = FileSystem as any;
        const baseDir = fs.cacheDirectory || fs.documentDirectory || '';
        const uri = baseDir + (baseDir.endsWith('/') ? '' : '/') + `Academy_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

        await fs.writeAsStringAsync(uri, wbout, { encoding: 'base64' });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Academy Master Report',
                UTI: 'com.microsoft.excel.xlsx'
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Export Error:', error);
        return { success: false, error: 'Failed to generate unified master report.' };
    }
};

/**
 * Exports targeted data for the current view (attendance or fees)
 */
export const exportContextRecords = async (
    mode: 'attendance' | 'fees' | 'students' | 'analytics',
    context: string,
    dateOrMonth: string,
    students: Student[]
): Promise<{ success: boolean; error?: string }> => {
    try {
        const wb = XLSX.utils.book_new();
        let title = '';
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        if (mode === 'attendance') {
            const parts = dateOrMonth.split('-');
            if (parts.length < 2) return { success: false, error: 'Invalid date format provided.' };

            const yearStr = parts[0];
            const monthStr = parts[1]; // e.g. "12"
            const monthLabel = monthNames[parseInt(monthStr, 10) - 1];
            title = `Attendance_${context}_${monthLabel}_${yearStr}`;

            // 1. Calculate the exact number of days for THIS month
            const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();

            // 2. Generate explicit headers for days (01, 02.. up to end of month)
            const dayHeaders: string[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
                dayHeaders.push(d < 10 ? `0${d}` : `${d}`);
            }

            const rows = students.map(s => {
                const row: any = {
                    'Student Name': s.fullName || 'Unknown',
                    'Phone Number': s.phoneNumber || '-',
                };

                // Initialize current month's columns with '-'
                dayHeaders.forEach(dayCol => {
                    row[dayCol] = '-';
                });

                // 3. Match records strictly by Year and Month
                if (s.attendanceHistory && Array.isArray(s.attendanceHistory)) {
                    s.attendanceHistory.forEach(h => {
                        const hParts = h.date.split('-');
                        if (hParts.length === 3) {
                            const [hYear, hMonth, hDay] = hParts;
                            // Strict check: Must match the report's year and month
                            if (hYear === yearStr && hMonth === monthStr) {
                                // Double check the day exists in our grid
                                if (dayHeaders.includes(hDay)) {
                                    const statusText = h.status === 'Present' ? 'P' : 'A';
                                    const processedText = h.markedByName ? ` (${h.markedByName})` : '';
                                    row[hDay] = statusText + processedText;
                                }
                            }
                        }
                    });
                }
                return row;
            });

            // Use the explicit header option to ensure column order and prevent bleed from other keys
            const ws = XLSX.utils.json_to_sheet(rows, { header: ['Student Name', 'Phone Number', ...dayHeaders] });

            const colWidths = [
                { wch: 25 }, // Name
                { wch: 15 }, // Phone
            ];
            dayHeaders.forEach(() => colWidths.push({ wch: 4 }));
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Attendance Register');
        } else if (mode === 'fees') {
            const parts = dateOrMonth.split('-');
            const year = parts[0];
            const month = parts[1];
            const monthLabel = monthNames[parseInt(month, 10) - 1];
            title = `Fees_${context}_${monthLabel}_${year}`;

            const rows = students.map(s => {
                const record = s.feeHistory?.find(f => f.month === month && f.year === year);
                return {
                    'Student Name': s.fullName || 'Unknown',
                    'Phone Number': s.phoneNumber || '-',
                    'Month': monthLabel,
                    'Year': year,
                    'Amount (₹)': record?.amount || s.sessionFee || 0,
                    'Status': record?.status || 'Pending',
                    'Payment Date': record?.paidDate ? new Date(record.paidDate).toLocaleDateString() : '-',
                    'Processed By': record?.markedByName || '-'
                };
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [
                { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'Fee Payments');
        } else if (mode === 'students') {
            title = `Roster_${context}`.replace(/ /g, '_');
            const rows = students.map(s => ({
                'ID': s.id.slice(-6).toUpperCase(),
                'Student Name': s.fullName,
                'Phone Number': s.phoneNumber,
                'Timings': s.sessionTimings,
                'Monthly Fee (₹)': s.sessionFee,
                'Joining Date': s.joiningDate || new Date(s.createdAt).toLocaleDateString(),
                'Address': s.address
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, ws, 'Student Roster');
        } else if (mode === 'analytics') {
            title = `Analytics_${context}`.replace(/ /g, '_');
            // Simplified summary for Excel
            const rows = [
                { 'Metric': 'Total Students', 'Value': students.length },
                { 'Metric': 'Batch Context', 'Value': context },
                { 'Metric': 'Report Date', 'Value': new Date().toLocaleDateString() },
                {}, // Gap
                { 'Metric': 'REPORTS SUMMARY' },
                { 'Metric': 'Overall Attendance Rate (%)', 'Value': 'See Attendance Log' },
                { 'Metric': 'Current Month Collection (%)', 'Value': 'See Fee Log' }
            ];
            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws, 'Summary');
        }

        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fs = FileSystem as any;
        const baseDir = fs.cacheDirectory || fs.documentDirectory || '';
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
        const uri = baseDir + (baseDir.endsWith('/') ? '' : '/') + fileName;

        await fs.writeAsStringAsync(uri, wbout, { encoding: 'base64' });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Records',
                UTI: 'com.microsoft.excel.xlsx'
            });
            return { success: true };
        } else {
            return { success: false, error: 'Sharing unavailable' };
        }
    } catch (error: any) {
        console.error('Context Export Error:', error);
        return { success: false, error: error.message };
    }
};
