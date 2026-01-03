export default function SubscriptionExpiredPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Trial Skončil</h1>
                    <p className="text-slate-600 mb-6">
                        Váš skúšobný prístup vypršal. Pre pokračovanie v používaní AgencyFlow kontaktujte administrátora.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="mailto:support@agencyflow.sk"
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
                        >
                            Kontaktovať podporu
                        </a>
                        <a
                            href="/login"
                            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition"
                        >
                            Späť na prihlásenie
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
