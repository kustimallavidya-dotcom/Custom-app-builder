
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Smartphone, 
  Settings, 
  ShieldCheck, 
  Cpu, 
  Download, 
  History, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  Code
} from 'lucide-react';
import { BuildStep, PwaMetadata, AppConfig, BuildResult } from './types';
import { analyzePwaUrl, generateAndroidProject } from './geminiService';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<BuildStep>(BuildStep.WELCOME);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwaMetadata, setPwaMetadata] = useState<PwaMetadata | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    appName: '',
    packageName: '',
    versionName: '1.0.0',
    versionCode: 1,
    orientation: 'portrait',
    minSdk: 24,
    iconUrl: '',
    splashColor: '#FFFFFF'
  });
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [history, setHistory] = useState<BuildResult[]>([]);

  // Local storage for history
  useEffect(() => {
    const saved = localStorage.getItem('pwa_build_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleStartAnalysis = async () => {
    if (!url) {
      setError('कृपया एक वैध URL प्रविष्ट करा. (Please enter a valid URL)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePwaUrl(url);
      if (!data.isValid) throw new Error('ही एक वैध PWA लिंक वाटत नाही. (Not a valid PWA)');
      setPwaMetadata(data);
      setAppConfig(prev => ({
        ...prev,
        appName: data.name || '',
        packageName: `com.pwa.${data.shortName.toLowerCase().replace(/[^a-z]/g, '')}`,
        iconUrl: data.icons?.[0]?.src || '',
        splashColor: data.themeColor || '#FFFFFF'
      }));
      setCurrentStep(BuildStep.APP_CONFIG);
    } catch (err: any) {
      setError(err.message || 'काहीतरी चूक झाली. पुन्हा प्रयत्न करा. (Something went wrong)');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildProject = async () => {
    setLoading(true);
    setCurrentStep(BuildStep.BUILDING);
    try {
      const result = await generateAndroidProject(appConfig, pwaMetadata!);
      setBuildResult(result);
      const newHistory = [result, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('pwa_build_history', JSON.stringify(newHistory));
      setCurrentStep(BuildStep.EXPORT);
    } catch (err) {
      setError('बिल्ड प्रक्रियेत त्रुटी आली. (Build process failed)');
      setCurrentStep(BuildStep.APP_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <div className="max-w-4xl mx-auto text-center mt-20">
      <div className="mb-8 inline-block p-4 bg-indigo-100 rounded-full">
        <Smartphone className="w-16 h-16 text-indigo-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4 marathi">PWA ते Android कनवर्टर</h1>
      <p className="text-xl text-gray-600 mb-12 marathi">तुमची वेबसाइट काही मिनिटांत प्ले स्टोअर रेडी ॲपमध्ये बदला.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setCurrentStep(BuildStep.URL_INPUT)}
          className="flex items-center justify-between p-6 bg-white border-2 border-indigo-500 rounded-2xl shadow-sm hover:shadow-md transition-all group"
        >
          <div className="text-left">
            <h3 className="text-xl font-semibold text-gray-900 marathi">नवीन ॲप तयार करा</h3>
            <p className="text-sm text-gray-500">Create New App</p>
          </div>
          <PlusCircle className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => {/* View History Logic */}}
          className="flex items-center justify-between p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group"
        >
          <div className="text-left">
            <h3 className="text-xl font-semibold text-gray-900 marathi">मागील बिल्ड्स</h3>
            <p className="text-sm text-gray-500">Build History</p>
          </div>
          <History className="w-8 h-8 text-gray-400 group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>
    </div>
  );

  const renderUrlInput = () => (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 marathi">तुमचा PWA URL टाका</h2>
      <p className="text-gray-500 mb-8">Paste your PWA URL here to start detection</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 marathi">वेबसाइट लिंक (Website Link)</label>
          <div className="relative">
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all text-lg"
            />
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm marathi">{error}</p>
          </div>
        )}

        <button 
          disabled={loading}
          onClick={handleStartAnalysis}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="marathi">ॲप तपशील शोधा</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderAppConfig = () => (
    <div className="max-w-4xl mx-auto mt-12 mb-20">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold marathi">ॲप कॉन्फिगरेशन</h2>
            <p className="opacity-80">Step 2: App Details</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <Settings className="w-8 h-8" />
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 marathi">ॲपचे नाव (App Name)</label>
              <input 
                type="text" 
                value={appConfig.appName}
                onChange={(e) => setAppConfig({...appConfig, appName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 marathi">पॅकेजचे नाव (Package Name)</label>
              <input 
                type="text" 
                value={appConfig.packageName}
                onChange={(e) => setAppConfig({...appConfig, packageName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 marathi">व्हर्जन कोड (Code)</label>
                <input 
                  type="number" 
                  value={appConfig.versionCode}
                  onChange={(e) => setAppConfig({...appConfig, versionCode: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 marathi">व्हर्जन नाव (Name)</label>
                <input 
                  type="text" 
                  value={appConfig.versionName}
                  onChange={(e) => setAppConfig({...appConfig, versionName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="font-semibold mb-4 marathi">देखावा आणि ओरिएंटेशन</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2 marathi">ॲप आयकॉन प्रिव्ह्यू</label>
                <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border p-2 flex items-center justify-center overflow-hidden">
                  {appConfig.iconUrl ? (
                    <img src={appConfig.iconUrl} alt="App Icon" className="w-full h-full object-contain" />
                  ) : (
                    <Smartphone className="w-12 h-12 text-gray-300" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2 marathi">स्क्रीन ओरिएंटेशन</label>
                <div className="flex gap-3">
                  {['portrait', 'landscape'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setAppConfig({...appConfig, orientation: mode as any})}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                        appConfig.orientation === mode 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between">
          <button 
            onClick={() => setCurrentStep(BuildStep.URL_INPUT)}
            className="px-6 py-2 text-gray-600 font-medium marathi"
          >
            मागे जा (Back)
          </button>
          <button 
            onClick={() => setCurrentStep(BuildStep.COMPLIANCE)}
            className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors marathi"
          >
            पुढे चला (Next)
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="max-w-3xl mx-auto mt-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-emerald-600 px-8 py-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold marathi">Google Play तपासणी</h2>
          <p className="opacity-80">Step 3: Play Store Readiness</p>
        </div>
        <ShieldCheck className="w-10 h-10" />
      </div>

      <div className="p-8 space-y-4">
        <p className="text-gray-600 mb-6 marathi">तुमचे ॲप प्ले स्टोअरच्या नियमांचे पालन करत असल्याची खात्री करा:</p>
        {[
          { m: 'ॲप मध्ये जाहिराती नाहीत (No default ads)', e: 'No embedded trackers or hidden ads.' },
          { m: 'युजर डेटा सुरक्षा (Data Privacy)', e: 'Clear privacy policy required on PWA.' },
          { m: 'बॅकग्राउंड डेटा वापर नाही', e: 'No unauthorized background services.' },
          { m: 'योग्य आयकॉन साईझ', e: 'Adaptive icons will be generated.' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold marathi">{item.m}</p>
              <p className="text-sm text-gray-500">{item.e}</p>
            </div>
          </div>
        ))}

        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-500" />
          <p className="text-sm text-amber-800 marathi">नोंद: ॲप पब्लिश करण्यासाठी तुम्हाला स्वतःचे कीस्टोअर (Signing Key) वापरावे लागेल.</p>
        </div>
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between">
        <button onClick={() => setCurrentStep(BuildStep.APP_CONFIG)} className="px-6 py-2 text-gray-600 font-medium marathi">मागे जा</button>
        <button 
          onClick={handleBuildProject}
          className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all marathi flex items-center gap-3"
        >
          <Cpu className="w-5 h-5" />
          ॲप तयार करा (Build App)
        </button>
      </div>
    </div>
  );

  const renderBuilding = () => (
    <div className="max-w-2xl mx-auto mt-20 text-center">
      <div className="relative inline-block mb-8">
        <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <Cpu className="w-12 h-12 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h2 className="text-3xl font-bold mb-4 marathi">ॲप तयार होत आहे...</h2>
      <div className="space-y-3">
        <p className="text-gray-600 animate-pulse marathi">Android प्रकल्प कोड जनरेट होत आहे</p>
        <p className="text-gray-400 text-sm italic marathi">कृपया थांबा, हे साधारण ३० सेकंद घेऊ शकते.</p>
      </div>
    </div>
  );

  const renderExport = () => (
    <div className="max-w-4xl mx-auto mt-12 mb-20">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gray-900 px-8 py-8 text-white text-center">
          <div className="mb-4 inline-block p-4 bg-green-500/20 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold marathi">अभिनंदन! तुमचे ॲप तयार आहे.</h2>
          <p className="opacity-70 mt-2">App successfully built for {appConfig.appName}</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <button className="flex items-center justify-between p-6 bg-indigo-50 border-2 border-indigo-600 rounded-2xl group transition-all">
              <div className="text-left">
                <h3 className="text-lg font-bold text-indigo-900 marathi">APK डाउनलोड करा</h3>
                <p className="text-xs text-indigo-600">Testing version for devices</p>
              </div>
              <Download className="w-8 h-8 text-indigo-600 group-hover:bounce transition-all" />
            </button>
            <button className="flex items-center justify-between p-6 bg-emerald-50 border-2 border-emerald-600 rounded-2xl group transition-all">
              <div className="text-left">
                <h3 className="text-lg font-bold text-emerald-900 marathi">AAB डाउनलोड करा</h3>
                <p className="text-xs text-emerald-600">Play Store release version</p>
              </div>
              <Download className="w-8 h-8 text-emerald-600 group-hover:bounce transition-all" />
            </button>
          </div>

          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 marathi">
              <Code className="w-6 h-6 text-gray-500" />
              Android प्रकल्प कोड (Project Files)
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-300 p-6 rounded-xl font-mono text-sm overflow-x-auto max-h-60 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="flex justify-between items-center mb-4 text-gray-500 border-b border-gray-800 pb-2">
                  <span>AndroidManifest.xml</span>
                  <button onClick={() => navigator.clipboard.writeText(buildResult?.manifestXml || '')} className="text-xs hover:text-white">Copy</button>
                </div>
                <pre>{buildResult?.manifestXml}</pre>
              </div>
              <div className="bg-gray-900 text-gray-300 p-6 rounded-xl font-mono text-sm overflow-x-auto max-h-60 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="flex justify-between items-center mb-4 text-gray-500 border-b border-gray-800 pb-2">
                  <span>build.gradle (Module: app)</span>
                  <button onClick={() => navigator.clipboard.writeText(buildResult?.gradleConfig || '')} className="text-xs hover:text-white">Copy</button>
                </div>
                <pre>{buildResult?.gradleConfig}</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 flex justify-center">
          <button 
            onClick={() => {
              setCurrentStep(BuildStep.WELCOME);
              setUrl('');
            }}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors marathi"
          >
            नवीन प्रोजेक्ट सुरू करा
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Smartphone className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight marathi">PWA बिल्डर</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className={`text-sm font-medium transition-colors ${currentStep === BuildStep.URL_INPUT ? 'text-indigo-600' : 'text-gray-400'} marathi`}>१. लिंक टाका</div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className={`text-sm font-medium transition-colors ${currentStep === BuildStep.APP_CONFIG ? 'text-indigo-600' : 'text-gray-400'} marathi`}>२. माहिती भरा</div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className={`text-sm font-medium transition-colors ${currentStep === BuildStep.COMPLIANCE ? 'text-indigo-600' : 'text-gray-400'} marathi`}>३. सुरक्षा तपासणी</div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className={`text-sm font-medium transition-colors ${currentStep === BuildStep.EXPORT ? 'text-indigo-600' : 'text-gray-400'} marathi`}>४. डाउनलोड</div>
          </div>
        </div>
      </nav>

      {/* Content Render */}
      <div className="px-6">
        {currentStep === BuildStep.WELCOME && renderWelcome()}
        {currentStep === BuildStep.URL_INPUT && renderUrlInput()}
        {currentStep === BuildStep.APP_CONFIG && renderAppConfig()}
        {currentStep === BuildStep.COMPLIANCE && renderCompliance()}
        {currentStep === BuildStep.BUILDING && renderBuilding()}
        {currentStep === BuildStep.EXPORT && renderExport()}
      </div>

      {/* Footer Info (Marathi) */}
      {currentStep === BuildStep.WELCOME && (
        <div className="max-w-4xl mx-auto mt-20 p-8 bg-indigo-900 rounded-3xl text-white">
          <h2 className="text-2xl font-bold mb-4 marathi">का वापरावे?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-indigo-300 mb-2 marathi">१००% सुरक्षित</h4>
              <p className="text-sm opacity-80">तुमचा कोणताही डेटा आमच्याकडे साठवला जात नाही.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-300 mb-2 marathi">मराठी इंटरफेस</h4>
              <p className="text-sm opacity-80">सोप्या मराठी भाषेत सर्व स्टेप्स उपलब्ध.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-300 mb-2 marathi">प्ले स्टोअर रेडी</h4>
              <p className="text-sm opacity-80">आम्ही कडक Google Play नियमांचे पालन करतो.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
