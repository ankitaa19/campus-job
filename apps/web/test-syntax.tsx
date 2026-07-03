const TestComponent = () => {
  const activeTab = 'overview';
  const saving = false;
  const handleSave = () => {};

  return (
    <div>
      {activeTab === 'overview' && (
        <div className="grid">
          <div className="content">
            <div className="section">
              <div className="contact">
                <h3>Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <input
                      type="tel"
                      className="w-full px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-medium ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestComponent;
