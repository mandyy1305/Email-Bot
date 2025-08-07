import { useState } from 'react'
import Header from './components/Header'
import TabNavigation from './components/TabNavigation'
import Dashboard from './components/Dashboard'
import ExcelUpload from './components/ExcelUpload'
import ManualEntry from './components/ManualEntry'
import EmailPreview from './components/EmailPreview'
import EmailTemplateEditor from './components/EmailTemplateEditor'
import ConfigurationSummary from './components/ConfigurationSummary'
import SendEmailButton from './components/SendEmailButton'

function App() {
  const [excelData, setExcelData] = useState(null)
  const [columns, setColumns] = useState([])
  const [manualData, setManualData] = useState([])
  const [processedData, setProcessedData] = useState(null)
  const [filteredData, setFilteredData] = useState(null)
  const [selectedFields, setSelectedFields] = useState({
    firstName: '',
    lastName: '',
    emails: [],
    emailStatuses: [],
    customFields: {}
  })
  const [emailConfig, setEmailConfig] = useState({
    subject: '',
    body: '',
    attachments: []
  })
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleSendEmails = async () => {
    try {
      // Use filtered data if available, otherwise fall back to processed data
      const dataToSend = filteredData || processedData
      
      if (!dataToSend || dataToSend.length === 0) {
        alert('No recipients to send emails to. Please add recipients first.')
        return
      }

      // Convert processed data to the format expected by the backend
      const recipients = []
      dataToSend.forEach(person => {
        person.emails.forEach(emailEntry => {
          recipients.push({
            email: emailEntry.email,
            firstName: person.firstName,
            lastName: person.lastName,
            emailColumn: emailEntry.column,
            emailStatus: emailEntry.status,
            rowIndex: person.rowIndex
          })
        })
      })

      // Convert File objects to base64 for transmission
      const processedAttachments = await Promise.all(
        emailConfig.attachments.map(async (attachment) => {
          // Check if it's a File object (from file input) or template attachment (from database)
          if (attachment instanceof File) {
            // Handle File objects
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: attachment.name,
                  type: attachment.type,
                  data: reader.result.split(',')[1], // Remove data URL prefix
                  size: attachment.size
                });
              };
              reader.readAsDataURL(attachment);
            });
          } else {
            // Handle template attachments (already stored)
            return {
              name: attachment.originalname || attachment.filename,
              type: attachment.mimetype,
              path: attachment.path, // Backend will handle file reading
              size: attachment.size
            };
          }
        })
      );

      const payload = {
        recipients,
        subject: emailConfig.subject,
        body: emailConfig.body,
        attachments: processedAttachments
      }

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Success! ${result.data.totalJobs} emails have been queued for sending.`)
        console.log('Email queue result:', result)
      } else {
        alert(`Error: ${result.error?.message || 'Failed to queue emails'}`)
        console.error('Email queue error:', result)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
      console.error('Error sending emails:', error)
    }
  }

  const handleFilterChange = (filtered) => {
    setFilteredData(filtered)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <Header />
        
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'dashboard' && (
          <Dashboard />
        )}

        {activeTab === 'excel' && (
          <div className="space-y-8">
            <ExcelUpload
              excelData={excelData}
              setExcelData={setExcelData}
              columns={columns}
              setColumns={setColumns}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
              processedData={processedData}
              setProcessedData={setProcessedData}
            />
            
            {processedData && (
              <EmailPreview
                processedData={processedData}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-8">
            <ManualEntry
              manualData={manualData}
              setManualData={setManualData}
              processedData={processedData}
              setProcessedData={setProcessedData}
            />
            
            {processedData && (
              <EmailPreview
                processedData={processedData}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <EmailTemplateEditor
            onTemplateChange={(template) => {
              setEmailConfig({
                subject: template.subject || '',
                body: template.body || '',
                attachments: template.attachments || []
              });
            }}
            onSave={(template) => {
              console.log('Template saved:', template);
            }}
          />
        )}

        {(activeTab !== 'dashboard') && (
          <>
            <ConfigurationSummary
              excelData={excelData}
              columns={columns}
              selectedFields={selectedFields}
              emailConfig={emailConfig}
              processedData={processedData}
              filteredData={filteredData}
              manualData={manualData}
            />

            <SendEmailButton
              processedData={processedData}
              filteredData={filteredData}
              selectedFields={selectedFields}
              emailConfig={emailConfig}
              onSendEmails={handleSendEmails}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default App
