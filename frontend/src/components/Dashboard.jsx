import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [emailHistory, setEmailHistory] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalEmails: 0,
    sentEmails: 0,
    failedEmails: 0,
    pendingEmails: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('history');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch email history
      const historyResponse = await fetch('/api/history/emails');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('Email history response:', historyData); // Debug log
        
        // The backend returns: { success: true, data: { emails: [...], pagination: {...} } }
        const emails = Array.isArray(historyData.data?.emails) ? historyData.data.emails : 
                      Array.isArray(historyData.data) ? historyData.data : 
                      Array.isArray(historyData.emails) ? historyData.emails : 
                      Array.isArray(historyData) ? historyData : [];
        setEmailHistory(emails);
        console.log('Processed emails:', emails); // Debug log
      }

      // Fetch campaigns
      const campaignsResponse = await fetch('/api/history/campaigns');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        console.log('Campaigns response:', campaignsData); // Debug log
        
        // The backend returns: { success: true, data: { campaigns: [...] } }
        const campaigns = Array.isArray(campaignsData.data?.campaigns) ? campaignsData.data.campaigns : 
                         Array.isArray(campaignsData.data) ? campaignsData.data : 
                         Array.isArray(campaignsData.campaigns) ? campaignsData.campaigns : 
                         Array.isArray(campaignsData) ? campaignsData : [];
        setCampaigns(campaigns);
        console.log('Processed campaigns:', campaigns); // Debug log
      }

      // Fetch stats
      const statsResponse = await fetch('/api/emails/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const newStats = statsData.data || statsData.stats || statsData || stats;
        setStats({
          totalEmails: newStats.totalEmails || newStats.total || 0,
          sentEmails: newStats.sentEmails || newStats.sent || 0,
          failedEmails: newStats.failedEmails || newStats.failed || 0,
          pendingEmails: newStats.pendingEmails || newStats.pending || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'processing':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-300">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Emails</p>
              <p className="text-2xl font-semibold text-white">{stats.totalEmails}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Sent</p>
              <p className="text-2xl font-semibold text-white">{stats.sentEmails}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-red-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Failed</p>
              <p className="text-2xl font-semibold text-white">{stats.failedEmails}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-semibold text-white">{stats.pendingEmails}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex space-x-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => setSelectedView('history')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
            selectedView === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Email History
        </button>
        <button
          onClick={() => setSelectedView('campaigns')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
            selectedView === 'campaigns'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Campaigns
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {selectedView === 'history' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Email History</h3>
              <p className="text-sm text-gray-400">Recent email sending activity</p>
            </div>
            <div className="p-6">
              {!Array.isArray(emailHistory) || emailHistory.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No emails sent yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Start by uploading an Excel file or adding recipients manually.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sender</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sent At</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {emailHistory.map((email, index) => (
                        <tr key={email._id || index} className="hover:bg-gray-700/50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{email.recipient?.email || email.to || email.email || 'N/A'}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-blue-400">{email.sender?.email || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{email.sender?.name || ''}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-300 max-w-xs truncate">{email.subject || 'N/A'}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(email.status)}`}>
                              {email.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(email.sentAt || email.createdAt)}</td>
                          <td className="px-4 py-4 text-sm text-gray-400 font-mono max-w-xs truncate">{email.messageId || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedView === 'campaigns' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Email Campaigns</h3>
              <p className="text-sm text-gray-400">Organized email campaigns and their performance</p>
            </div>
            <div className="p-6">
              {!Array.isArray(campaigns) || campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No campaigns created yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Campaigns will appear here when you send bulk emails.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((campaign, index) => (
                    <div key={campaign._id || index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-2">{campaign.name || campaign.title || `Campaign ${index + 1}`}</h4>
                      <p className="text-sm text-gray-400 mb-3">{campaign.description || campaign.desc || 'No description'}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Recipients:</span>
                          <span className="text-white">{campaign.totalRecipients || campaign.total || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Sent:</span>
                          <span className="text-green-400">{campaign.sentCount || campaign.sent || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Failed:</span>
                          <span className="text-red-400">{campaign.failedCount || campaign.failed || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-gray-300">{formatDate(campaign.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchDashboardData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
