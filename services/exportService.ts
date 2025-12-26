
import { Transaction, Settings } from "../types";

export const exportToCSV = (transactions: Transaction[], settings: Settings) => {
  // Cấu hình ban đầu
  const settingsHeader = ["THÔNG TIN THIẾT LẬP"];
  const initialCashRow = ["Tiền mặt ban đầu", settings.initialCash.toLocaleString() + " VND"];
  const initialBankRow = ["Tài khoản ban đầu", settings.initialBank.toLocaleString() + " VND"];
  const dailyCostRow = ["Chi phí mỗi ngày mục tiêu", settings.dailyCost.toLocaleString() + " VND"];
  const spacer = [""];

  // Header danh sách giao dịch
  const transactionHeader = ["DANH SÁCH GIAO DỊCH"];
  const headers = ["Ngày", "Nội dung", "Loại", "Nguồn", "Số tiền (VND)"];
  
  // Dữ liệu giao dịch
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('vi-VN'),
    t.content.replace(/,/g, ' '), // Tránh lỗi dấu phẩy trong CSV
    t.type,
    t.source,
    t.amount
  ]);

  // Tổng hợp nội dung CSV
  const csvContent = [
    settingsHeader.join(","),
    initialCashRow.join(","),
    initialBankRow.join(","),
    dailyCostRow.join(","),
    spacer.join(","),
    transactionHeader.join(","),
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  // Tạo blob với UTF-8 BOM để Excel hiển thị đúng tiếng Việt
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Kích hoạt tải xuống
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Sao_Ke_Tai_Chinh_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
