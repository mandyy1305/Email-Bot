const SendEmailButton = ({ 
  processedData,
  filteredData,
  selectedFields, 
  emailConfig, 
  onSendEmails 
}) => {
  const dataToSend = filteredData || processedData
  const emailCount = dataToSend ? dataToSend.reduce((sum, person) => sum + person.emails.length, 0) : 0
  
  const isReadyToSend = dataToSend && 
                       dataToSend.length > 0 &&
                       emailCount > 0 &&
                       emailConfig.subject && 
                       emailConfig.body;

  return (
    <div className="mt-8 text-center">
      <button
        onClick={onSendEmails}
        disabled={!isReadyToSend}
        className={`
          px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform
          ${isReadyToSend 
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg cursor-pointer' 
            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Send {emailCount} Emails</span>
        </div>
      </button>
      {isReadyToSend && (
        <p className="text-slate-300 text-sm mt-3">
          Ready to send {emailCount} emails to {dataToSend.length} recipients
        </p>
      )}
      {!isReadyToSend && (
        <p className="text-slate-400 text-sm mt-3">
          Please add recipients, configure email settings, and ensure you have valid data
        </p>
      )}
    </div>
  );
};

export default SendEmailButton;