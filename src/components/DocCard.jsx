import { useRef, useState } from 'react';
import { statusLabel, reqLabel } from '../utils.js';

const STATUS_OPTIONS = ['pendente', 'enviado', 'em_analise', 'aprovado'];

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocCard({ doc, canValidate, canUpload, onStatusChange, onUpload, onDownload }) {
  const [comment, setComment] = useState(doc.comentario || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const options = doc.req === 'obrigatorio' ? STATUS_OPTIONS : [...STATUS_OPTIONS, 'nao_aplicavel'];

  function handleStatus(e) {
    onStatusChange(doc.id, e.target.value);
  }

  function handleCommentSubmit() {
    if (comment.trim()) onStatusChange(doc.id, 'correcao', comment.trim());
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(doc.id, file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="doc-card" data-testid={`doc-card-${doc.id}`}>
      <div className="dtitle">{doc.nome}</div>
      <div className="dmeta">
        <span className="req-badge">{reqLabel(doc.req)}</span>
        <span className={`doc-status ${doc.status}`}>{statusLabel(doc.status)}</span>
      </div>

      {doc.versaoVigente ? (
        <button
          type="button"
          onClick={() => onDownload(doc.versaoVigente.id, doc.versaoVigente.nomeOriginal)}
          style={{
            marginTop: 9,
            fontSize: 11.5,
            color: 'var(--acai)',
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            textDecoration: 'underline',
          }}
        >
          ⬇ {doc.versaoVigente.nomeOriginal} ({formatSize(doc.versaoVigente.tamanho)})
        </button>
      ) : (
        <div style={{ marginTop: 9, fontSize: 11.5, color: 'var(--ink-faint)' }}>Nenhum arquivo enviado ainda.</div>
      )}

      {canUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            id={`file-${doc.id}`}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <label
            htmlFor={`file-${doc.id}`}
            className="btn outline sm"
            style={{ marginTop: 8, width: '100%', justifyContent: 'center', opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? 'Enviando…' : doc.versaoVigente ? 'Enviar nova versão' : 'Enviar arquivo'}
          </label>
        </>
      )}

      {canValidate ? (
        <>
          <label className="mono" style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 10 }}>
            Alterar status
          </label>
          <select className="doc-select" value={doc.status} onChange={handleStatus} aria-label={`Status de ${doc.nome}`}>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {statusLabel(opt)}
              </option>
            ))}
          </select>

          <label className="doc-comment-label" htmlFor={`comment-${doc.id}`} style={{ color: 'var(--ink-faint)' }}>
            Solicitar correção (exige motivo)
          </label>
          <textarea
            id={`comment-${doc.id}`}
            className="doc-comment"
            style={{ borderColor: 'var(--line-strong)' }}
            placeholder="Explique o que precisa ser corrigido ou reenviado…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="button"
            className="btn danger sm"
            style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
            onClick={handleCommentSubmit}
          >
            Solicitar correção
          </button>
        </>
      ) : (
        doc.comentario && (
          <div className="callout warn" style={{ marginTop: 10, marginBottom: 0, padding: '9px 11px', fontSize: 11.5 }}>
            <strong style={{ marginBottom: 2 }}>Motivo da correção</strong>
            {doc.comentario}
          </div>
        )
      )}
    </div>
  );
}
