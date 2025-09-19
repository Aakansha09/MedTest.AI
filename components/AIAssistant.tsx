import React, { useState, useRef, useEffect } from 'react';
import { getAIAssistantResponse } from '../services/geminiService';
import { TestCase, Report, ChatMessage, View } from '../types';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { XIcon } from './icons/XIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DonutChart } from './DonutChart';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { exportAsCSV, exportReportDataAsCSV, exportReportDataAsPDF } from '../utils/exportUtils';
import { CrosshairsIcon } from './icons/CrosshairsIcon';
import { CopyIcon } from './icons/CopyIcon';

interface AIAssistantProps {
  testCases: TestCase[];
  reports: Report[];
  setActiveView: (view: View) => void;
  activeView: View;
}

const QuickActionButton: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void; }> = ({ icon, text, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2.5 p-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary hover:bg-gray-50 transition-colors w-full text-left">
        {icon}
        <span>{text}</span>
    </button>
);

const CATEGORY_CHART_COLORS: Record<string, string> = {
    'API': '#6366F1',
    'Functional': '#10B981',
    'Security': '#EF4444',
    'Performance': '#F59E0B',
    'Integration': '#8B5CF6',
    'Usability': '#EC4899',
    'Boundary': '#3B82F6',
    'Uncategorized': '#6B7280',
};


export const AIAssistant: React.FC<AIAssistantProps> = ({ testCases, reports, setActiveView, activeView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const greetingShownRef = useRef(false);
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Hide greeting if chat is opened
    if (isOpen) {
        setShowGreeting(false);
    }
    
    // Show greeting only when dashboard is viewed for the first time
    if (activeView === 'dashboard' && !isOpen && !greetingShownRef.current) {
        greetingShownRef.current = true; // Mark as shown for this session
        
        const showTimer = setTimeout(() => {
            setShowGreeting(true);
        }, 500); // Delay before showing
        
        const hideTimer = setTimeout(() => {
            setShowGreeting(false);
        }, 5500); // Hide after 5 seconds

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }
  }, [activeView, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          sender: 'ai',
          type: 'text',
          text: "Hello! I'm your MedTest AI assistant. I can help you generate reports, export data, analyze compliance, and answer questions about your test cases. What would you like to do today?",
        },
      ]);
    } else {
        setMessages([]);
    }
  }, [isOpen]);

 const handleSelectReportForExport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const newAiMessage: ChatMessage = {
        sender: 'ai',
        type: 'format_selection',
        text: `Great! How would you like to export "${report.name}"?`,
        reportId: reportId,
      };
      setMessages(prev => [...prev, newAiMessage]);
    }
  };

  const handleExportFormatSelection = (reportId: string, format: 'PDF' | 'CSV') => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      if (format === 'PDF') {
        exportReportDataAsPDF(report);
      } else {
        exportReportDataAsCSV(report);
      }
      const newAiMessage: ChatMessage = {
        sender: 'ai',
        type: 'text',
        text: `I've started the ${format} download for "${report.name}".`,
      };
      setMessages(prev => [...prev, newAiMessage]);
    }
  };

  const handleSelectCategoryForExport = (category: string) => {
    const filteredCases = testCases.filter(tc => tc.tags[0] === category);
    if (filteredCases.length > 0) {
        exportAsCSV(filteredCases, `${category.toLowerCase().replace(/[\s/]+/g, '_')}_test_cases`);
        const newAiMessage: ChatMessage = {
            sender: 'ai',
            type: 'text',
            text: `I've started the CSV download for all ${filteredCases.length} "${category}" test cases.`,
        };
        setMessages(prev => [...prev, newAiMessage]);
    } else {
         const newAiMessage: ChatMessage = {
            sender: 'ai',
            type: 'text',
            text: `It seems there are no test cases for the "${category}" category.`,
        };
        setMessages(prev => [...prev, newAiMessage]);
    }
};

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim()) return;

    const newUserMessage: ChatMessage = { text: textToSend, sender: 'user', type: 'text' };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await getAIAssistantResponse(textToSend, testCases, reports);
      let newAiMessage: ChatMessage;

      try {
        const aiJson = JSON.parse(aiResponseText);
        if (aiJson.action === 'show_test_distribution_by_category') {
            const distribution = testCases.reduce((acc, tc) => {
                const category = tc.tags[0] || 'Uncategorized';
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            newAiMessage = {
                sender: 'ai',
                type: 'chart',
                chartData: distribution,
                text: "Here's the current test distribution by category:",
            };
        } else if (aiJson.action === 'request_category_selection' && aiJson.categories) {
           newAiMessage = {
              sender: 'ai',
              type: 'category_selection',
              categories: aiJson.categories,
              text: "Of course. Which category of test cases would you like to export?",
          };
        } else if (aiJson.action === 'navigate_to_impact_analysis') {
            newAiMessage = { sender: 'ai', type: 'text', text: "Of course. Navigating you to the Test Impact Analysis tool..." };
            setTimeout(() => {
                setActiveView('impact-analysis');
                setIsOpen(false);
            }, 1000);
        } else if (aiJson.action === 'navigate_to_duplicates') {
            newAiMessage = { sender: 'ai', type: 'text', text: "Sure thing. Let's find some duplicates. Opening the tool now..." };
            setTimeout(() => {
                setActiveView('duplicates');
                setIsOpen(false);
            }, 1000);
        } else {
          newAiMessage = { text: aiResponseText, sender: 'ai', type: 'text' };
        }
      } catch (parseError) {
        newAiMessage = { text: aiResponseText, sender: 'ai', type: 'text' };
      }
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        text: 'Sorry, I had trouble connecting. Please try again.',
        sender: 'ai',
        type: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { text: 'Test distribution', icon: <ChartPieIcon className="w-5 h-5 text-text-secondary"/>, prompt: "Show me the test distribution" },
    { text: 'Analyze test impact', icon: <CrosshairsIcon className="w-5 h-5 text-text-secondary"/>, prompt: "Analyze test impact" },
    { text: 'Find duplicate tests', icon: <CopyIcon className="w-5 h-5 text-text-secondary"/>, prompt: "Find duplicate tests" },
    { text: 'Export test cases', icon: <DownloadIcon className="w-5 h-5 text-text-secondary"/>, prompt: "Export a report" },
  ];

  const transformChartData = (data: Record<string, number>) => {
      return Object.entries(data)
          .filter(([, value]) => value > 0)
          .map(([name, value]) => ({
              name,
              value,
              color: CATEGORY_CHART_COLORS[name] || '#718096', // default gray
          }));
  };

  return (
    <>
      {showGreeting && (
        <div className="fixed bottom-24 right-6 w-auto max-w-[280px] bg-surface rounded-xl shadow-2xl p-4 z-40 animate-fade-in-up border border-border-color text-left">
          <p className="text-sm font-semibold text-text-primary">Hi from your AI Assistant!</p>
          <p className="text-sm text-text-secondary mt-1">Click me to analyze test data, generate reports, or ask questions.</p>
          <div className="absolute -bottom-2 right-5 w-4 h-4 bg-surface transform rotate-45 border-b border-r border-border-color"></div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-teal-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-teal-600 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 z-50"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <XIcon className="w-8 h-8"/> : <ChatBubbleIcon className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[600px] bg-background rounded-2xl shadow-2xl border border-border-color flex flex-col z-50 overflow-hidden transform transition-all duration-300 ease-out animate-slide-in">
          <header className="bg-teal-700 text-white p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
                <ChatBubbleIcon className="w-6 h-6" />
                <h2 className="font-semibold text-lg">MedTest AI Assistant</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-teal-600 rounded-full" aria-label="Close chat">
                <XIcon className="w-5 h-5"/>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-lg'
                      : 'bg-gray-200 text-text-primary rounded-bl-lg'
                  }`}
                >
                  {msg.type === 'text' && msg.text}
                  {msg.type === 'chart' && msg.chartData && (
                      <div className="space-y-2">
                           {msg.text && <p className="font-medium text-text-primary mb-2">{msg.text}</p>}
                           <div className="bg-white p-2 rounded-lg">
                               <DonutChart data={transformChartData(msg.chartData)} />
                           </div>
                      </div>
                  )}
                   {msg.type === 'report_selection' && (
                      <div className="space-y-2">
                          {msg.text && <p className="mb-3">{msg.text}</p>}
                          <div className="space-y-2">
                              {msg.reports?.map(report => (
                                  <button 
                                      key={report.id}
                                      onClick={() => handleSelectReportForExport(report.id)}
                                      className="w-full text-left p-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary hover:bg-gray-100 transition-colors"
                                  >
                                      {report.name}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
                  {msg.type === 'category_selection' && (
                    <div className="space-y-2">
                        {msg.text && <p className="mb-3">{msg.text}</p>}
                        <div className="space-y-2">
                            {msg.categories?.map(category => (
                                <button 
                                    key={category}
                                    onClick={() => handleSelectCategoryForExport(category)}
                                    className="w-full text-left p-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary hover:bg-gray-100 transition-colors"
                                >
                                    {category} Test Cases
                                </button>
                            ))}
                        </div>
                    </div>
                  )}
                  {msg.type === 'format_selection' && msg.reportId && (
                    <div className="space-y-2">
                        {msg.text && <p className="mb-3">{msg.text}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleExportFormatSelection(msg.reportId!, 'PDF')}
                                className="w-full text-center p-2 bg-white border border-border-color rounded-lg text-sm text-text-primary hover:bg-gray-100 transition-colors"
                            >
                                PDF
                            </button>
                            <button
                                onClick={() => handleExportFormatSelection(msg.reportId!, 'CSV')}
                                className="w-full text-center p-2 bg-white border border-border-color rounded-lg text-sm text-text-primary hover:bg-gray-100 transition-colors"
                            >
                                CSV
                            </button>
                        </div>
                    </div>
                   )}
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex justify-start">
                  <div className="bg-gray-200 text-text-primary rounded-2xl px-4 py-2.5 rounded-bl-lg">
                      <div className="flex items-center justify-center gap-1.5">
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                      </div>
                  </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>
            
          {messages.length <= 1 && !isLoading && (
              <div className="p-4 border-t border-border-color">
                  <p className="text-sm font-medium text-text-secondary mb-3">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map(action => (
                        <QuickActionButton key={action.text} icon={action.icon} text={action.text} onClick={() => handleSendMessage(action.prompt)} />
                    ))}
                  </div>
              </div>
          )}

          <div className="p-4 bg-surface border-t border-border-color flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Ask me anything..."
                className="w-full bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 disabled:opacity-50"
                disabled={isLoading}
              />
              <button onClick={() => handleSendMessage()} disabled={isLoading || !userInput.trim()} className="p-2.5 rounded-lg bg-teal-500 text-white disabled:bg-teal-300 hover:bg-teal-600 transition-colors">
                <PaperAirplaneIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slide-in {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
        }
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
};