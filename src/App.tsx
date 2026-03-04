/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Settings, 
  Database as DbIcon, 
  LogIn, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  BookOpen,
  User,
  GraduationCap,
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import Papa from 'papaparse';

// --- Types ---
interface Topic {
  id: number;
  title: string;
  author: string;
  major: string;
  course: string;
  level: string;
}

interface SettingsData {
  ai_criteria: string;
}

interface AnalysisResult {
  score: number;
  reason: string;
  overview: string;
  status: 'Safe' | 'Warning' | 'Danger';
  similarTopics: {
    id: number;
    title: string;
    similarity: number;
    explanation: string;
    major: string;
    course: string;
    level: string;
  }[];
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, isAdmin, onLogout }: any) => (
  <header className="sticky top-0 z-50">
    {/* Institutional Top Bar */}
    <div className="bg-ueb-blue text-white py-1.5 text-[11px] font-medium hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex gap-4">
          <a href="https://ueb.vnu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors">TRANG CHỦ UEB</a>
          <a href="https://vnu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors uppercase">Đại học Quốc gia Hà Nội</a>
        </div>
        <div className="flex gap-4">
          <span>Email: phongdaotao@ueb.edu.vn</span>
          <span>Hotline: (024) 3754 7506</span>
        </div>
      </div>
    </div>

    <nav className="bg-white border-b border-zinc-200 shadow-sm">
      <div className="h-1 bg-ueb-red w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('guest')}>
            <img 
              src="https://ueb.vnu.edu.vn/Content/images/logo.png" 
              alt="UEB Logo" 
              className="w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-ueb-blue">UEB - CHECKER</span>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Hệ thống rà soát đề tài</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('guest')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'guest' ? 'text-ueb-blue bg-blue-50' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Kiểm tra đề tài
            </button>
            
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setActiveTab('admin-topics')}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'admin-topics' ? 'text-ueb-blue bg-blue-50' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  Quản lý đề tài
                </button>
                <button 
                  onClick={() => setActiveTab('admin-settings')}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'admin-settings' ? 'text-ueb-blue bg-blue-50' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  Tiêu chuẩn AI
                </button>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <button 
                onClick={() => setActiveTab('login')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  </header>
);

const GuestModule = ({ topics, settings }: { topics: Topic[], settings: SettingsData }) => {
  const [inputTitle, setInputTitle] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Thạc sĩ');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!inputTitle.trim()) return;
    setIsAnalyzing(true);
    
    try {
      // ĐÃ SỬA: Dùng import.meta.env để Vite có thể đọc được API Key
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // ĐÃ SỬA: Nâng cấp lên Model xử lý siêu tốc, không bị quá tải
        contents: `
          Bạn là một chuyên gia đánh giá đề tài nghiên cứu khoa học tại Trường Đại học Kinh tế - ĐHQGHN (UEB). 
          Nhiệm vụ: Đánh giá mức độ trùng lặp của đề tài dự kiến với danh sách các đề tài đã thực hiện.
          
          Tiêu chuẩn đánh giá: ${settings.ai_criteria}
          
          Đề tài dự kiến: "${inputTitle}"
          Cấp đào tạo dự kiến: "${selectedLevel}"
          
          Danh sách đề tài đã thực hiện (gồm ${topics.length} đề tài):
          ${topics.map(t => `- ID: ${t.id}, Title: "${t.title}", Major: "${t.major}", Course: "${t.course}", Level: "${t.level}"`).join('\n')}
          
          LỆNH TỐI QUAN TRỌNG DÀNH CHO BẠN (BẮT BUỘC TUÂN THỦ):
          1. Dù danh sách có dài đến đâu, bạn BẮT BUỘC phải quét toàn bộ để tìm ra các đề tài tương đồng nhất.
          2. NẾU điểm trùng lặp (score) bạn đánh giá là > 30%, BẮT BUỘC mảng "similarTopics" phải chứa chính xác 3 đề tài giống nhất. 
          3. TUYỆT ĐỐI KHÔNG ĐƯỢC lười biếng bỏ qua mảng "similarTopics" hoặc trả về mảng rỗng nếu score > 30%. Đây là lỗi nghiêm trọng.
          
          Hãy trả về kết quả dưới dạng JSON với cấu trúc:
          {
            "score": number (0-100, 100 là trùng lặp hoàn toàn),
            "status": "Safe" | "Warning" | "Danger" (Safe: <30%, Warning: 30-70%, Danger: >70%),
            "reason": "Kết luận ngắn gọn (1 câu)",
            "overview": "Đánh giá tổng quan chi tiết về kết quả tìm kiếm, bao gồm nhận xét về tính mới của đề tài và lời khuyên cho người nghiên cứu (bằng tiếng Việt, chuyên nghiệp, khoảng 3-4 câu)",
            "similarTopics": [
              { 
                "id": number, 
                "title": "tên đề tài", 
                "similarity": number (0-100),
                "explanation": "Thuyết minh chi tiết tại sao đề tài này tương đồng với đề tài dự kiến (bằng tiếng Việt)",
                "major": "chuyên ngành của đề tài này",
                "course": "khóa đào tạo của đề tài này",
                "level": "cấp đào tạo của đề tài này"
              }
            ] (Chỉ lấy top 3 đề tài có độ tương đồng cao nhất > 30%)
          }
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              status: { type: Type.STRING },
              reason: { type: Type.STRING },
              overview: { type: Type.STRING },
              similarTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    similarity: { type: Type.NUMBER },
                    explanation: { type: Type.STRING },
                    major: { type: Type.STRING },
                    course: { type: Type.STRING },
                    level: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      let rawText = response.text || '{}';
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const data = JSON.parse(rawText);
      
      // Khóa chống sập: Đảm bảo similarTopics luôn là mảng
      if (!data.similarTopics) {
        data.similarTopics = [];
      }
      
      setResult(data);
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      alert("Lỗi kết nối AI: " + (error.message || "Không rõ nguyên nhân. Vui lòng F5 tải lại trang."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative bg-ueb-blue py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="https://picsum.photos/seed/university/1920/1080" 
            alt="Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ueb-blue/80 to-ueb-blue" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Hệ thống Kiểm tra Trùng lặp Đề tài
            </h1>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              Công cụ hỗ trợ sinh viên và học viên UEB rà soát tên đề tài nghiên cứu, 
              đảm bảo tính mới và tránh trùng lặp với kho dữ liệu học thuật của Nhà trường.
            </p>

            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col gap-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input 
                    type="text"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder="Nhập tên đề tài dự kiến của bạn..."
                    className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !inputTitle}
                  className="bg-ueb-red hover:bg-red-700 disabled:opacity-50 text-white px-10 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                >
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'KIỂM TRA NGAY'}
                </button>
              </div>
              
              <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-100">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cấp đào tạo:</span>
                <div className="flex gap-2">
                  {['Cử nhân', 'Thạc sĩ', 'Tiến sĩ'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        selectedLevel === level 
                          ? 'bg-ueb-blue text-white shadow-md' 
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4">
        <AnimatePresence>
          {!result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            >
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-ueb-blue" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2">Kho dữ liệu lớn</h4>
                <p className="text-sm text-zinc-500">Truy cập hàng ngàn đề tài từ các khóa học trước tại UEB.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-ueb-red" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2">Phân tích AI</h4>
                <p className="text-sm text-zinc-500">Sử dụng mô hình Gemini 3.1 Pro để đánh giá độ tương đồng ngữ nghĩa.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2">Đảm bảo tính mới</h4>
                <p className="text-sm text-zinc-500">Giúp sinh viên định hướng đề tài nghiên cứu độc đáo và giá trị.</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-8 rounded-3xl border border-zinc-200 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className={`text-6xl font-black mb-2 ${result.score > 70 ? 'text-ueb-red' : result.score > 40 ? 'text-amber-500' : 'text-ueb-blue'}`}>
                    {result.score}%
                  </div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Mức độ trùng lặp</div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    result.status === 'Danger' ? 'bg-red-100 text-ueb-red' : 
                    result.status === 'Warning' ? 'bg-amber-100 text-amber-600' : 
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {result.status === 'Danger' ? 'Rủi ro cao' : result.status === 'Warning' ? 'Cần lưu ý' : 'An toàn'}
                  </div>
                </div>
                
                <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-ueb-blue" />
                    Đánh giá tổng quan từ Hệ thống AI
                  </h3>
                  <div className="flex-1">
                    <p className="text-zinc-900 font-bold mb-3 text-lg leading-tight">
                      {result.reason}
                    </p>
                    <p className="text-zinc-600 leading-relaxed italic">
                      {result.overview}
                    </p>
                  </div>
                  {result.status === 'Safe' && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-sm text-emerald-700 font-medium">Đề tài có tính mới cao, bạn có thể tự tin triển khai nghiên cứu.</span>
                    </div>
                  )}
                </div>
              </div>

              {result.similarTopics && result.similarTopics.length > 0 && (
                <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900">Các đề tài có nội dung tương đồng</h3>
                    <span className="text-xs font-medium text-zinc-400 bg-zinc-200 px-2 py-1 rounded uppercase">Top kết quả</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-zinc-50/50 border-b border-zinc-100">
                        <tr>
                          <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Đề tài tham chiếu</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Thông tin đào tạo</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Thuyết minh đánh giá</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Độ tương đồng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {result.similarTopics.map((topic, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors group">
                            <td className="px-8 py-6 max-w-md">
                              <div className="text-[10px] font-bold text-ueb-blue mb-1 uppercase tracking-tight">Mã số: #{topic.id}</div>
                              <div className="font-bold text-zinc-900 leading-snug group-hover:text-ueb-blue transition-colors">{topic.title}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-ueb-blue w-fit uppercase">
                                  {topic.level}
                                </span>
                                <div className="text-sm font-medium text-zinc-700">{topic.major}</div>
                                <div className="text-xs text-zinc-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Khóa {topic.course}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 max-w-sm">
                              <p className="text-sm text-zinc-600 leading-relaxed italic">
                                {topic.explanation}
                              </p>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex flex-col items-end gap-2">
                                <div className={`text-xl font-black ${topic.similarity > 70 ? 'text-ueb-red' : topic.similarity > 40 ? 'text-amber-500' : 'text-ueb-blue'}`}>
                                  {topic.similarity}%
                                </div>
                                <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${topic.similarity > 70 ? 'bg-ueb-red' : topic.similarity > 40 ? 'bg-amber-500' : 'bg-ueb-blue'}`}
                                    style={{ width: `${topic.similarity}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AdminTopics = ({ topics, onRefresh }: { topics: Topic[], onRefresh: () => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    major: '',
    course: '',
    level: 'Thạc sĩ'
  });

  // Filter states
  const [filterCourse, setFilterCourse] = useState('');
  const [filterMajor, setFilterMajor] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý checkbox xóa hàng loạt
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Get unique values for filters
  const courses = Array.from(new Set(topics.map(t => t.course))).sort();
  const majors = Array.from(new Set(topics.map(t => t.major))).sort();
  const levels = Array.from(new Set(topics.map(t => t.level))).sort();

  const filteredTopics = topics.filter(topic => {
    const matchesCourse = !filterCourse || topic.course === filterCourse;
    const matchesMajor = !filterMajor || topic.major === filterMajor;
    const matchesLevel = !filterLevel || topic.level === filterLevel;
    const matchesSearch = !searchTerm || 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCourse && matchesMajor && matchesLevel && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTopic ? `/api/topics/${editingTopic.id}` : '/api/topics';
    const method = editingTopic ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Admin123'
      },
      body: JSON.stringify(formData)
    });
    
    setIsAdding(false);
    setEditingTopic(null);
    setFormData({ title: '', author: '', major: '', course: '', level: 'Thạc sĩ' });
    onRefresh();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data.map((row: any) => ({
          title: row['Tên đề tài'] || row['title'],
          author: row['Tác giả'] || row['author'],
          major: row['Ngành'] || row['major'],
          course: row['Khóa'] || row['course'],
          level: row['Cấp đào tạo'] || row['level']
        })).filter(item => item.title && item.author);

        if (data.length > 0) {
          try {
            const response = await fetch('/api/topics/bulk', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Admin123'
              },
              body: JSON.stringify(data)
            });
            if (response.ok) {
              alert(`Đã nhập thành công ${data.length} đề tài.`);
              onRefresh();
            } else {
              alert('Lỗi khi nhập dữ liệu.');
            }
          } catch (error) {
            console.error('Import error:', error);
            alert('Lỗi kết nối máy chủ.');
          }
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong file.');
        }
        setIsImporting(false);
        e.target.value = '';
      },
      error: (error) => {
        console.error('CSV Parse error:', error);
        alert('Lỗi khi đọc file CSV.');
        setIsImporting(false);
      }
    });
  };

  const downloadSample = () => {
    const csv = Papa.unparse([
      {
        'Tên đề tài': 'Tên đề tài mẫu 1',
        'Tác giả': 'Nguyễn Văn A',
        'Ngành': 'Khoa học máy tính',
        'Khóa': '2023',
        'Cấp đào tạo': 'Thạc sĩ'
      },
      {
        'Tên đề tài': 'Tên đề tài mẫu 2',
        'Tác giả': 'Trần Thị B',
        'Ngành': 'Quản trị kinh doanh',
        'Khóa': '2022',
        'Cấp đào tạo': 'Tiến sĩ'
      }
    ]);
    
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_nhap_de_tai.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đề tài này?')) return;
    await fetch(`/api/topics/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Admin123' }
    });
    onRefresh();
  };

  // Hàm chọn từng đề tài
  const handleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // Hàm chọn tất cả các đề tài đang hiển thị
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTopics.map(t => t.id)); 
    } else {
      setSelectedIds([]);
    }
  };

  // Hàm xóa hàng loạt
  const handleDeleteBulk = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} đề tài đã chọn? Hành động này không thể hoàn tác.`)) return;

    try {
      const res = await fetch("/api/topics/delete-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Admin123"
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (res.ok) {
        alert("Đã xóa thành công!");
        setSelectedIds([]);
        onRefresh();
      } else {
        alert("Có lỗi xảy ra khi xóa.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      author: topic.author,
      major: topic.major,
      course: topic.course,
      level: topic.level
    });
    setIsAdding(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Quản lý danh sách đề tài</h2>
          <p className="text-zinc-500">Hiển thị {filteredTopics.length} / {topics.length} đề tài</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadSample}
            className="text-zinc-600 hover:text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border border-zinc-200 hover:bg-zinc-50"
          >
            <Download className="w-4 h-4" />
            File mẫu
          </button>
          <label className="cursor-pointer bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isImporting} />
          </label>
          
          {/* Nút Xóa Hàng Loạt */}
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteBulk}
              className="bg-ueb-red hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md shadow-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Xóa {selectedIds.length}
            </button>
          )}

          <button 
            onClick={() => { setIsAdding(true); setEditingTopic(null); }}
            className="bg-ueb-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm đề tài mới
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Tìm kiếm tên đề tài, tác giả..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-ueb-blue/20 outline-none"
          />
        </div>
        <select 
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-ueb-blue/20 outline-none"
        >
          <option value="">Tất cả Cấp đào tạo</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select 
          value={filterMajor}
          onChange={e => setFilterMajor(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-ueb-blue/20 outline-none"
        >
          <option value="">Tất cả Ngành</option>
          {majors.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select 
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-ueb-blue/20 outline-none"
        >
          <option value="">Tất cả Khóa</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">{editingTopic ? 'Chỉnh sửa đề tài' : 'Thêm đề tài mới'}</h3>
                <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-600">×</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Tên đề tài</label>
                    <textarea 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Tác giả</label>
                    <input 
                      required
                      type="text"
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Ngành</label>
                    <input 
                      required
                      type="text"
                      value={formData.major}
                      onChange={e => setFormData({...formData, major: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Khóa học (Năm)</label>
                    <input 
                      required
                      type="text"
                      value={formData.course}
                      onChange={e => setFormData({...formData, course: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Cấp đào tạo</label>
                    <select 
                      value={formData.level}
                      onChange={e => setFormData({...formData, level: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none"
                    >
                      <option>Thạc sĩ</option>
                      <option>Tiến sĩ</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg font-medium hover:bg-zinc-50"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-ueb-blue text-white rounded-lg font-medium hover:bg-blue-800"
                  >
                    {editingTopic ? 'Cập nhật' : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {/* Cột Checkbox trên tiêu đề */}
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={selectedIds.length > 0 && selectedIds.length === filteredTopics.length}
                  className="w-4 h-4 text-ueb-blue rounded border-zinc-300 focus:ring-ueb-blue cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Thông tin đề tài</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Chuyên ngành & Khóa</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredTopics.map(topic => (
              <tr key={topic.id} className="hover:bg-blue-50/30 transition-colors group">
                {/* Cột Checkbox từng dòng */}
                <td className="px-6 py-5 text-center">
                  <input 
                    type="checkbox" 
                    onChange={() => handleSelect(topic.id)}
                    checked={selectedIds.includes(topic.id)}
                    className="w-4 h-4 text-ueb-blue rounded border-zinc-300 focus:ring-ueb-blue cursor-pointer"
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-zinc-900 mb-1.5 leading-snug group-hover:text-ueb-blue transition-colors">{topic.title}</div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-zinc-400" /> {topic.author}</span>
                    <span className="flex items-center gap-1.5 bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-medium">{topic.level}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm font-medium text-zinc-700">{topic.major}</div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Khóa {topic.course}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(topic)}
                      className="p-2 text-zinc-400 hover:text-ueb-blue hover:bg-blue-50 rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(topic.id)}
                      className="p-2 text-zinc-400 hover:text-ueb-red hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSettings = ({ settings, onRefresh }: { settings: SettingsData, onRefresh: () => void }) => {
  const [criteria, setCriteria] = useState(settings.ai_criteria);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Admin123'
      },
      body: JSON.stringify({ ai_criteria: criteria })
    });
    setIsSaving(false);
    onRefresh();
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-ueb-blue" />
            Cấu hình tiêu chuẩn đánh giá AI
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Thiết lập các tiêu chí mà AI sẽ sử dụng để so sánh và đánh giá mức độ trùng lặp.</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Tiêu chuẩn đánh giá (Prompt Context)</label>
            <textarea 
              value={criteria}
              onChange={e => setCriteria(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none min-h-[200px] leading-relaxed"
              placeholder="Ví dụ: Đánh giá dựa trên từ khóa, đối tượng nghiên cứu, phạm vi thời gian và địa điểm..."
            />
            <p className="text-xs text-zinc-400 mt-2">
              * Nội dung này sẽ được gửi kèm trong mỗi yêu cầu phân tích của AI để định hướng cách đánh giá.
            </p>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-ueb-blue hover:bg-blue-800 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginModule = ({ onLogin }: { onLogin: () => void }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === 'admin' && password === 'admin') { // Simple for demo
      onLogin();
    } else {
      setError('ID hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden"
      >
        <div className="bg-ueb-blue p-8 text-center text-white">
          <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Cổng Quản trị</h2>
          <p className="text-blue-100 text-sm mt-1 opacity-80 uppercase tracking-widest font-medium">Phòng Đào tạo UEB</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Tài khoản</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
              <input 
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none transition-all font-medium"
                placeholder="Nhập ID quản trị..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Mật khẩu</label>
            <div className="relative">
              <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-ueb-blue/20 focus:border-ueb-blue outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-ueb-red text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          <button 
            type="submit"
            className="w-full bg-ueb-blue hover:bg-blue-800 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            XÁC THỰC TRUY CẬP
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('guest');
  const [isAdmin, setIsAdmin] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [settings, setSettings] = useState<SettingsData>({ ai_criteria: '' });

  const fetchData = async () => {
    try {
      const [topicsRes, settingsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/settings')
      ]);
      const topicsData = await topicsRes.json();
      const settingsData = await settingsRes.json();
      setTopics(topicsData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={isAdmin}
        onLogout={() => { setIsAdmin(false); setActiveTab('guest'); }}
      />
      
      <main className="pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'guest' && (
            <motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GuestModule topics={topics} settings={settings} />
            </motion.div>
          )}
          
          {activeTab === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginModule onLogin={() => { setIsAdmin(true); setActiveTab('admin-topics'); }} />
            </motion.div>
          )}
          
          {activeTab === 'admin-topics' && isAdmin && (
            <motion.div key="admin-topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminTopics topics={topics} onRefresh={fetchData} />
            </motion.div>
          )}
          
          {activeTab === 'admin-settings' && isAdmin && (
            <motion.div key="admin-settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminSettings settings={settings} onRefresh={fetchData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-ueb-blue border-t border-white/10 py-12 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-1 rounded">
                  <img 
                    src="https://ueb.vnu.edu.vn/Content/images/logo.png" 
                    alt="UEB Logo" 
                    className="h-8 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-bold text-lg">UEB - VNU</span>
              </div>
              <p className="text-blue-100 text-sm max-w-md">
                Trường Đại học Kinh tế - Đại học Quốc gia Hà Nội. 
                Địa chỉ: 144 đường Xuân Thủy, quận Cầu Giấy, Hà Nội, Việt Nam.
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-blue-200 text-sm mb-2">© 2024 Phần mềm Check tên đề tài UEB</p>
              <p className="text-blue-300 text-xs">Phát triển bởi Nguyễn Tiến Minh + Khang</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}