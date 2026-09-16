const studentSteps = ["Search", "Compare", "View", "Book", "Make Payments", "Move in"];
const landlordSteps = ["Register", "List property", "Verification", "Get approved", "Receive bookings", "Get paid"];

function StepRow({ title, steps }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-4">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-sm font-bold text-white shadow-md shadow-primary/25">
                {i + 1}
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-slate-600 sm:text-sm">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="mb-6 hidden text-slate-300 sm:inline">─────</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Process</span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">How It Works</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <StepRow title="For Students" steps={studentSteps} />
          <StepRow title="For Landlords" steps={landlordSteps} />
        </div>
      </div>
    </section>
  );
}