import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">LifeLink Privacy Statement</h1>
        <p className="text-slate-600 mb-8">
          Last updated: March 8, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Who We Are</h2>
          <p className="text-slate-700 leading-7">
            LifeLink is a platform that connects blood and organ donors with people seeking urgent medical help.
            This privacy statement explains how we collect, use, and protect your personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Information We Collect</h2>
          <p className="text-slate-700 leading-7 mb-2">We may collect:</p>
          <ul className="list-disc pl-6 text-slate-700 space-y-1">
            <li>Identity details such as name, date of birth, and gender.</li>
            <li>Contact details such as email, phone, and address.</li>
            <li>Medical request details such as blood group, organ requirement, urgency, and hospital name.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-1">
            <li>To match donors and receivers for medical support.</li>
            <li>To contact you regarding donation or request status.</li>
            <li>To improve service quality and platform safety.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">How We Share Information</h2>
          <p className="text-slate-700 leading-7">
            We only share relevant information with matched users and authorized medical coordination personnel.
            We do not sell your personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Data Security</h2>
          <p className="text-slate-700 leading-7">
            We use reasonable technical and organizational safeguards to protect personal data from unauthorized
            access, loss, or misuse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your Rights</h2>
          <p className="text-slate-700 leading-7">
            You may request access, correction, or removal of your personal information by contacting the LifeLink team.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Contact</h2>
          <p className="text-slate-700 leading-7">
            For privacy-related questions, contact us at
            {' '}
            <a className="text-red-600 font-semibold hover:underline" href="mailto:privacy@lifelink.org">
              privacy@lifelink.org
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
