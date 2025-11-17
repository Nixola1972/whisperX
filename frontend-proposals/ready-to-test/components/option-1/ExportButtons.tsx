'use client';

import { useState } from 'react';
import { exportTranscript } from '../../utils/exportTranscript';
import type { Transcription } from '../../types';

interface ExportButtonsProps {
  transcription: Transcription;
}

export function ExportButtons({ transcription }: ExportButtonsProps) {
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const handleExport = async (format: 'txt' | 'srt' | 'pdf' | 'docx') => {
    setExportingFormat(format);

    try {
      await exportTranscript(transcription, format);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Esportazione ${format.toUpperCase()} fallita. Riprova.`);
    } finally {
      setExportingFormat(null);
    }
  };

  const formats = [
    {
      value: 'txt' as const,
      label: 'TXT',
      color: 'blue',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      value: 'srt' as const,
      label: 'SRT',
      color: 'violet',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      value: 'pdf' as const,
      label: 'PDF',
      color: 'red',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: 'docx' as const,
      label: 'DOCX',
      color: 'emerald',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3v4a2 2 0 002 2h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {formats.map((format) => {
        const isExporting = exportingFormat === format.value;
        const colorClasses = {
          blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400',
          violet: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-400',
          red: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400',
          emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
        }[format.color];

        return (
          <button
            key={format.value}
            onClick={() => handleExport(format.value)}
            disabled={exportingFormat !== null}
            className={`group relative px-2.5 py-1.5 rounded-lg border transition-all ${colorClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={`Esporta come ${format.label}`}
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {format.icon}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {format.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
