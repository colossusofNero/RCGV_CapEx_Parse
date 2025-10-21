'use client';

import { useState } from 'react';

export default function Home() {
  const [npId, setNpId] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!npId.trim()) {
      setError('Please enter an NP_ID');
      return;
    }

    if (!files || files.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('npId', npId);

      for (let i = 0; i < files.length; i++) {
        formData.append('pdfs', files[i]);
      }

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to process PDFs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capex_export_${npId}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('CSV file downloaded successfully!');
      setNpId('');
      setFiles(null);
      (document.getElementById('file-input') as HTMLInputElement).value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            RCGV CapEx PDF Parser
          </h1>
          <p className="text-gray-600 mb-8">
            Upload PDF files to extract payment information
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="np-id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                NP_ID
              </label>
              <input
                id="np-id"
                type="text"
                value={npId}
                onChange={(e) => setNpId(e.target.value)}
                placeholder="Enter NP_ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                PDF Files
              </label>
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {files && files.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Parse PDFs & Export CSV'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Output Format
            </h2>
            <p className="text-xs text-gray-600">
              CSV will contain: <strong>NP_ID</strong>, <strong>Name</strong>,{' '}
              <strong>Paid_Amount</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
