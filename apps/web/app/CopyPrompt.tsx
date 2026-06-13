'use client';
import { useState } from 'react';

const PROMPT = "Run `npx agentry-cli scan --submit` to measure my autonomy score and post it to the agentry leaderboard. Only numeric session metadata is transmitted — no prompts, code, or file paths.";

export default function CopyPrompt() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{position:'relative'}}>
      <code style={{
        display:'block', background:'#111', border:'1px solid #1f1f1f', borderRadius:'5px',
        padding:'12px 14px', paddingRight:'72px', fontSize:'12px', color:'#a3e635',
        fontFamily:"'Menlo','Monaco','Consolas',monospace", whiteSpace:'pre-wrap', lineHeight:'1.6',
      }}>
        {PROMPT}
      </code>
      <button
        onClick={handleCopy}
        style={{
          position:'absolute', top:'10px', right:'10px',
          background: copied ? '#1a2e0a' : '#1a1a1a',
          border: `1px solid ${copied ? '#2d5016' : '#2a2a2a'}`,
          borderRadius:'4px', padding:'4px 10px', cursor:'pointer',
          fontSize:'11px', fontWeight:500, color: copied ? '#a3e635' : '#6b7280',
          transition:'all 0.15s',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
