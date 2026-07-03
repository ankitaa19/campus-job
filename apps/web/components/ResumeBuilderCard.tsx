import { useRouter } from 'next/router';

interface ResumeBuilderCardProps {
  className?: string;
}

const ResumeBuilderCard: React.FC<ResumeBuilderCardProps> = ({ className = "" }) => {
  const router = useRouter();

  const handleWhatsAppClick = () => {
    // This will open WhatsApp with a pre-filled message for resume building
    const message = encodeURIComponent(
      "Hi! I want to create a tailored resume using the AI Resume Builder. Please help me get started."
    );
    // Note: Replace with actual WhatsApp business number
    const whatsappUrl = `https://wa.me/+1234567890?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl shadow-md hover:shadow-lg transition border border-purple-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
          <span className="mr-2">✨</span>
          AI Resume Builder
        </h2>
        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
          NEW
        </span>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Create professional resumes tailored to specific job descriptions using AI
        </p>
        
        <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-purple-100">
          <h3 className="font-medium text-purple-700 text-sm mb-2">🚀 Key Features:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">•</span>
              AI-powered job description analysis
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">•</span>
              Tailored resume generation
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">•</span>
              Professional PDF templates
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">•</span>
              WhatsApp delivery option
            </li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => router.push('/ai-resume-builder')}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <span className="mr-2">🎯</span>
            Create Resume Now
          </button>
          
          <button 
            onClick={handleWhatsAppClick}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <span className="mr-2">📱</span>
            Get Help via WhatsApp
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-3">
          <p className="text-xs text-purple-700 text-center font-medium">
            💡 Tip: Upload your profile first for better AI recommendations
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderCard;
