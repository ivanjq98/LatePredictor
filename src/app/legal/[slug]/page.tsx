"use client";

import { useParams, notFound } from 'next/navigation';
import { JSX } from 'react';

// Data object to hold the content for each page
const legalContent: Record<string, { title: string; content: JSX.Element }> = {
  "privacy": {
    title: "Privacy Policy",
    content: (
      <>
        <p>Your privacy is important to us. This policy explains how LatePredictor™ collects and uses your data.</p>
        <h3>Data Collection</h3>
        <p>We collect timestamp data and behavioral patterns to provide accurate lateness predictions.</p>
      </>
    )
  },
  "terms": {
    title: "Terms of Service",
    content: (
      <>
        <p>By using LatePredictor™, you agree to these terms. Please read them carefully.</p>
        <h3>Usage License</h3>
        <p>Permission is granted to use this tool for personal, non-commercial transitory viewing only.</p>
      </>
    )
  },
  "cookies": {
    title: "Cookie Policy",
    content: (
      <>
        <p>We use cookies to enhance your experience and analyze our traffic.</p>
        <h3>What are cookies?</h3>
        <p>Cookies are small text files stored on your device that help us remember your preferences.</p>
      </>
    )
  }
};

export default function LegalPage() {
  const params = useParams();
  const slug = params.slug as string;

  const pageData = legalContent[slug];

  if (!pageData) {
    return notFound(); // Shows the Next.js 404 page if the slug doesn't match
  }

  return (
    <main style={{ 
      maxWidth: '800px', 
      margin: '80px auto', 
      padding: '0 24px', 
      fontFamily: 'Nunito',
      lineHeight: '1.8',
      color: '#f3f3f3'
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#f2eded', marginBottom: '40px' }}>
        {pageData.title}
      </h1>
      
      <div style={{ backgroundColor: '#010101', fontSize: '1.1rem' }}>
        {pageData.content}
      </div>

      <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </main>
  );
}