import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Download } from 'lucide-react';
import { Player } from '../types';

interface ExcelImporterProps {
  onImport: (players: Omit<Player, 'id'>[]) => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Omit<Player, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('请上传 Excel 文件（.xlsx 或 .xls 格式）');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setIsPreviewing(false);
      setPreviewData([]);
    }
  };

  const parseExcel = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // 动态导入 xlsx
      const XLSX = await import('xlsx');

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!(result instanceof ArrayBuffer)) {
            setError('读取 Excel 文件内容失败，解析数据出错');
            setIsLoading(false);
            return;
          }
          const data = new Uint8Array(result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const players: Omit<Player, 'id'>[] = jsonData.map((row: any) => {
            const rawName = row['姓名'] || row['name'] || '';
            const rawStudentId = row['学号'] || row['studentId'] || row['student_id'] || '';
            const rawJerseyNumber = row['球衣号码'] || row['jerseyNumber'] || row['jersey_number'] || '';

            return {
              name: String(rawName).trim(),
              studentId: String(rawStudentId).trim(),
              jerseyNumber: String(rawJerseyNumber).trim(),
              photo: null,
              teamId: '',
            };
          });

          const validPlayers = players.filter(
            (p) => p.name && p.studentId && p.jerseyNumber
          );

          if (validPlayers.length === 0) {
            setError('未找到有效的球员数据，请检查 Excel 文件格式');
            setIsLoading(false);
            return;
          }

          setPreviewData(validPlayers);
          setIsPreviewing(true);
          setError(null);
          setIsLoading(false);
        } catch (err) {
          setError('解析 Excel 文件失败，请确保文件格式正确');
          console.error(err);
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('加载 Excel 解析库失败，请稍后重试');
      console.error(err);
      setIsLoading(false);
    }
  }, [file]);

  const handleConfirm = () => {
    if (previewData.length > 0) {
      onImport(previewData);
      setFile(null);
      setPreviewData([]);
      setIsPreviewing(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
    setIsPreviewing(false);
    setError(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      // 动态导入 xlsx
      const XLSX = await import('xlsx');

      const templateData = [
        {
          '姓名': '张三',
          '学号': '20210001',
          '球衣号码': '10'
        },
        {
          '姓名': '李四',
          '学号': '20210002',
          '球衣号码': '11'
        },
        {
          '姓名': '王五',
          '学号': '20210003',
          '球衣号码': '12'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '球员信息');

      XLSX.writeFile(workbook, '球员信息导入模板.xlsx');
    } catch (err) {
      setError('加载 Excel 解析库失败，请稍后重试');
      console.error(err);
    }
  };

  return (
    <div className="excel-importer">
      <h3 className="importer-title">
        <FileSpreadsheet size={20} />
        Excel 批量导入
      </h3>

      {!isPreviewing ? (
        <div className="upload-section">
          <div className="drop-zone">
            <Upload size={48} />
            <p>点击或拖拽上传 Excel 文件</p>
            <p className="hint">支持 .xlsx 和 .xls 格式</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {file && (
            <div className="file-info">
              <span>{file.name}</span>
              <button onClick={() => setFile(null)} className="remove-file">
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {file && !error && (
            <button onClick={parseExcel} className="parse-btn" disabled={isLoading}>
              {isLoading ? '解析中...' : '解析文件'}
            </button>
          )}
        </div>
      ) : (
        <div className="preview-section">
          <div className="preview-header">
            <h4>预览导入数据</h4>
            <p>共 {previewData.length} 条记录</p>
          </div>
          
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>球衣号码</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((player, index) => (
                  <tr key={index}>
                    <td>{player.name}</td>
                    <td>{player.studentId}</td>
                    <td>{player.jerseyNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="preview-actions">
            <button onClick={handleConfirm} className="confirm-btn">
              <Check size={16} />
              确认导入
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              <X size={16} />
              取消
            </button>
          </div>
        </div>
      )}

      <div className="template-info">
        <div className="template-header">
          <p>Excel 模板格式：</p>
          <button onClick={handleDownloadTemplate} className="download-template-btn">
            <Download size={16} />
            下载模板
          </button>
        </div>
        <ul>
          <li>列名：姓名、学号、球衣号码</li>
          <li>第一行为表头，从第二行开始为数据</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelImporter;
