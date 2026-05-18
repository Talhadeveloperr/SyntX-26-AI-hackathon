import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BASE_URL  = "http://136.243.35.104:8501/api";
const STUDENT_ID = 1;

const StudyMaterialsContext = createContext(null);

export function StudyMaterialsProvider({ children }) {
  const [subjects,    setSubjects]    = useState([]);
  const [subjectDocs, setSubjectDocs] = useState({});  // { subjectId: [{id,name,chunk_count,embedded}] }
  const [loading,     setLoading]     = useState(true);

  const fetchMaterials = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/subjects/with-documents?student_id=${STUDENT_ID}`);
      const data = await res.json();
      setSubjects(data.map(s => ({ id: s.subject_id, name: s.subject_name, folder_name: s.folder_name })));
      const docs = {};
      data.forEach(s => {
        docs[s.subject_id] = (s.documents || []).map(d => ({
          id:          d.document_id,
          name:        d.file_name,
          chunk_count: d.chunk_count,
          embedded:    d.embedded,
        }));
      });
      setSubjectDocs(docs);
    } catch { /* silent */ }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const addSubject = async (name) => {
    const res  = await fetch(`${BASE_URL}/subjects`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ student_id: STUDENT_ID, subject_name: name }),
    });
    const data = await res.json();
    await fetchMaterials();
    return data.subject_id;
  };

  const removeSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setSubjectDocs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const addDocs = async (subjectId, files) => {
    const form = new FormData();
    form.append("student_id", String(STUDENT_ID));
    Array.from(files).forEach(f => form.append("files", f));
    await fetch(`${BASE_URL}/subjects/${subjectId}/documents`, { method: "POST", body: form });
    await fetchMaterials();
  };

  const removeDoc = (subjectId, docId) => {
    setSubjectDocs(prev => ({
      ...prev,
      [subjectId]: (prev[subjectId] || []).filter(d => d.id !== docId),
    }));
  };

  return (
    <StudyMaterialsContext.Provider value={{
      subjects, subjectDocs, loading,
      addSubject, removeSubject, addDocs, removeDoc,
      refreshMaterials: fetchMaterials,
    }}>
      {children}
    </StudyMaterialsContext.Provider>
  );
}

export function useStudyMaterials() {
  return useContext(StudyMaterialsContext);
}
