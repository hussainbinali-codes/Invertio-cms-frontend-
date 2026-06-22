import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { 
  X, Briefcase, Link, ExternalLink, UploadCloud, 
  FileText, Trash2, Loader2, MessageSquare, Send,
  FolderOpen, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/ui/Skeleton';
import { cn } from '../../../utils/cn';
import { BASE_URL } from '../../../api/baseUrl';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import { hasPermission } from '../../../utils/permissionUtils';

const ProjectResourcesModal = ({ project, onClose, onUpdate }) => {
  useLockBodyScroll(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user?.role_name || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'super admin' || role === 'administrator';
  const canManageConfidential = isAdmin || user?.modules?.projects?.['documents.confidential'];
  const canManageResources = hasPermission('projects', 'resources.manage') || hasPermission('projects', 'edit');

  const [projectDocuments, setProjectDocuments] = useState([]);
  const [projectComments, setProjectComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [resourceLinks, setResourceLinks] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadClassification, setUploadClassification] = useState('internal');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState('');
  const chatEndRef = React.useRef(null);

  const normalizeResourceLinks = (links) => {
    if (!links) return [];

    let parsedLinks = links;

    if (typeof parsedLinks === 'string') {
      try {
        parsedLinks = JSON.parse(parsedLinks);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(parsedLinks)) return [];

    return parsedLinks
      .map((link) => ({
        title: link?.title || link?.name || '',
        url: link?.url || link?.link || '',
      }))
      .filter((link) => link.title || link.url);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectComments]);

  useEffect(() => {
    if (project) {
      setResourceLinks(normalizeResourceLinks(project.resource_links));
      fetchDocuments();
      fetchComments();
      fetchTasks();
      fetchProjectLinks();
    }
  }, [project]);

  const fetchProjectLinks = async () => {
    try {
      const res = await axios.get('/projects');
      const projects = Array.isArray(res.data.data) ? res.data.data : (res.data.data || []);
      const currentProject = projects.find((item) => item.id === project.id);

      if (currentProject) {
        setResourceLinks(normalizeResourceLinks(currentProject.resource_links));
      }
    } catch (err) {
      console.error('Fetch project links error', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`/projects/${project.id}/tasks`);
      setProjectTasks(res.data.data || []);
    } catch (err) {
      console.error("Fetch tasks error", err);
    }
  };

  const fetchDocuments = async () => {
    setDocLoading(true);
    try {
      const res = await axios.get(`/projects/${project.id}/documents`);
      setProjectDocuments(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch documents');
    } finally {
      setDocLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentLoading(true);
    try {
      const res = await axios.get(`/projects/${project.id}/comments`);
      setProjectComments(res.data.data || []);
    } catch (err) {
      console.error("Fetch comments error", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUpdateLinks = async () => {
    if (resourceLinks.length === 0) {
      toast.error('Please add at least one link before saving.');
      return;
    }

    for (let i = 0; i < resourceLinks.length; i++) {
      const link = resourceLinks[i];
      const title = link.title?.trim();
      const url = link.url?.trim();

      if (!title && !url) {
        toast.error(`Link #${i + 1} is empty. Please enter a title and URL, or remove it.`);
        return;
      }
      if (!title) {
        toast.error(`Please enter a title for Link #${i + 1}.`);
        return;
      }
      if (!url) {
        toast.error(`Please enter a URL for "${title}".`);
        return;
      }

      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlRegex.test(url)) {
        toast.error(`Please enter a valid URL for "${title}".`);
        return;
      }
    }

    setIsSavingLinks(true);
    try {
      await axios.patch(`/projects/${project.id}/github`, { resource_links: resourceLinks });
      toast.success('Links updated successfully');
      fetchProjectLinks();
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to update links');
    } finally {
      setIsSavingLinks(false);
    }
  };

  const handleUploadDocument = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('classification', uploadClassification);

    try {
      await axios.post(`/projects/${project.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${files.length} document(s) uploaded`);
      fetchDocuments();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

  const handleDeleteDocument = (docId) => {
    setConfirmModal({
      show: true,
      id: docId
    });
  };

  const performDelete = async (docId) => {
    try {
      await axios.delete(`/projects/documents/${docId}`);
      toast.success('Document removed');
      fetchDocuments();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setConfirmModal({ show: false, id: null });
    }
  };

  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      await axios.post(`/projects/${project.id}/comments`, { 
        comment: newComment,
        task_id: selectedTaskId 
      });
      setNewComment('');
      setSelectedTaskId(null);
      setSelectedTaskTitle('');
      fetchComments();
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setNewComment(value);

    const lastAtPos = value.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const query = value.substring(lastAtPos + 1).split(/\s/)[0];
      setMentionFilter(query);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const selectTask = (task) => {
    const lastAtPos = newComment.lastIndexOf('@');
    const beforeAt = newComment.substring(0, lastAtPos);
    const afterQuery = newComment.substring(lastAtPos + 1 + mentionFilter.length);
    
    setNewComment(`${beforeAt}@${task.title} ${afterQuery}`);
    setSelectedTaskId(task.id);
    setSelectedTaskTitle(task.title);
    setShowMentionList(false);
    setMentionFilter('');
  };

  const normalizeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-7xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[95vh]">
        <CardHeader className="flex flex-row items-center justify-between py-6 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
               <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Project Hub: Resources</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{project.name} • Internal Delivery Assets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-0 flex flex-col lg:flex-row flex-1 overflow-hidden bg-white">
          {/* Left Column: Links (25%) */}
          <div className="w-full lg:w-1/4 border-r border-slate-100 bg-slate-50/30 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Link className="w-3.5 h-3.5" />
                 Links
               </h3>
               {canManageResources && (
                 <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-primary-600 hover:bg-primary-50"
                  onClick={() => setResourceLinks([...resourceLinks, { title: '', url: '' }])}
                 >
                   <Plus className="w-4 h-4" />
                 </Button>
               )}
            </div>
            
            <div className="space-y-3">
               {resourceLinks.map((link, idx) => (
                 <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-primary-500 shadow-sm space-y-2 group hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between gap-2">
                       <input 
                          className="text-xs font-bold text-slate-800 border border-slate-100 rounded px-1.5 py-0.5 focus:border-primary-300 focus:outline-none w-full bg-slate-50/50"
                          placeholder="Title (e.g. Figma)"
                          value={link.title}
                          disabled={!canManageResources}
                          onChange={(e) => {
                            const updated = [...resourceLinks];
                            updated[idx].title = e.target.value;
                            setResourceLinks(updated);
                          }}
                       />
                       {canManageResources && (
                         <button 
                          onClick={() => setResourceLinks(resourceLinks.filter((_, i) => i !== idx))}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1 hover:bg-rose-50 rounded"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                          className="text-[11px] text-primary-600 font-medium border border-slate-100 rounded px-1.5 py-0.5 focus:border-primary-300 focus:outline-none w-full bg-slate-50/50 truncate"
                          placeholder="URL"
                          value={link.url}
                          disabled={!canManageResources}
                          onChange={(e) => {
                            const updated = [...resourceLinks];
                            updated[idx].url = e.target.value;
                            setResourceLinks(updated);
                          }}
                       />
                       {link.url && (
                         <a href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary-600 p-1 hover:bg-primary-50 rounded shrink-0">
                           <ExternalLink className="w-3.5 h-3.5" />
                         </a>
                       )}
                    </div>
                 </div>
               ))}
             </div>
             {canManageResources && (
               <Button 
                 className="w-full mt-5 h-9 text-xs font-bold uppercase tracking-wider bg-primary-600 text-white hover:bg-primary-700 shadow-sm flex items-center justify-center gap-1.5" 
                 onClick={handleUpdateLinks}
                 disabled={isSavingLinks}
               >
                 {isSavingLinks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
                 Save Resources
               </Button>
             )}
          </div>

          {/* Middle Column: Files (37.5%) */}
          <div className="w-full lg:w-[37.5%] border-r border-slate-100 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Files</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Asset storage</p>
              </div>
             {canManageResources && (
               <div className="flex items-center gap-2">
                 <select 
                   className="text-[10px] font-bold border border-slate-200 rounded-md bg-white p-1 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
                   value={uploadClassification}
                   onChange={(e) => setUploadClassification(e.target.value)}
                 >
                   <option value="internal">Internal</option>
                   {canManageConfidential && <option value="confidential">Confidential</option>}
                 </select>
                 <div className="relative">
                   <input type="file" id="resource-file-upload-comp" className="hidden" multiple onChange={handleUploadDocument} />
                   <Button 
                     onClick={() => document.getElementById('resource-file-upload-comp').click()}
                     disabled={isUploading}
                     className="bg-primary-600 hover:bg-primary-700 h-8 px-3 text-[10px] font-bold uppercase"
                   >
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <UploadCloud className="w-3 h-3 mr-2" />}
                      Upload
                   </Button>
                 </div>
               </div>
             )}
            </div>

            <div className="space-y-2">
              {docLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : projectDocuments.length === 0 ? (
                <div className="py-16 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Empty Vault</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-primary-200 transition-all group shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-900 truncate max-w-[120px]">{doc.file_name}</p>
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                              doc.classification === 'confidential' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {doc.classification || 'Internal'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-medium">
                            {(doc.file_size / 1024).toFixed(0)}KB • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={doc.file_url || `${BASE_URL.replace('/api', '')}/${doc.file_key}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-primary-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {canManageResources && (
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Comments (37.5%) */}
          <div className="flex-1 p-6 flex flex-col bg-slate-50/50 overflow-hidden">
             <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Feed</h3>
             </div>

             <div className={cn("flex-1 mb-4 pr-2 custom-scrollbar", projectComments.length > 0 ? "overflow-y-auto space-y-4" : "overflow-hidden flex flex-col justify-center")}>
                {commentLoading ? (
                   <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-3/4 rounded-2xl" />)}
                   </div>
                ) : projectComments.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                      <MessageSquare className="w-8 h-8 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Start a Discussion</p>
                   </div>
                ) : (
                   projectComments.map((comment) => (
                      <div key={comment.id} className={cn(
                         "flex flex-col max-w-[85%]",
                         comment.user_id === user.id ? "ml-auto items-end" : "mr-auto items-start"
                      )}>
                         <div className={cn(
                            "p-3 rounded-2xl text-xs shadow-sm border",
                            comment.user_id === user.id 
                              ? "bg-primary-600 text-white border-primary-500 rounded-tr-none" 
                              : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                         )}>
                            {comment.task_title && (
                               <div className={cn(
                                 "mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                                 comment.user_id === user.id ? "bg-white/20 text-white" : "bg-primary-50 text-primary-600"
                               )}>
                                 <FileText className="w-2.5 h-2.5" />
                                 {comment.task_title}
                               </div>
                            )}
                            <div>{comment.comment}</div>
                         </div>
                         <div className="flex items-center gap-2 mt-1 px-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{comment.user_name}</span>
                            <span className="text-[8px] text-slate-300">•</span>
                            <span className="text-[8px] text-slate-300">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                      </div>
                   ))
                )}
                <div ref={chatEndRef} />
             </div>

             <form onSubmit={handlePostComment} className="relative mt-auto">
                {showMentionList && projectTasks.length > 0 && (
                   <div className="absolute bottom-full left-0 mb-2 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-10 p-2 animate-in slide-in-from-bottom-2 duration-200">
                      <div className="px-2 py-1 mb-1 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Task</div>
                      {projectTasks
                        .filter(t => t.title.toLowerCase().includes(mentionFilter.toLowerCase()))
                        .map(task => (
                           <button
                              key={task.id}
                              type="button"
                              onClick={() => selectTask(task)}
                              className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors flex items-center justify-between group"
                           >
                              <span className="truncate">{task.title}</span>
                              <span className="text-[9px] text-slate-300 group-hover:text-primary-300 font-bold uppercase">{task.status}</span>
                           </button>
                        ))
                      }
                      {projectTasks.filter(t => t.title.toLowerCase().includes(mentionFilter.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-[10px] text-slate-400 italic">No matching tasks...</div>
                      )}
                   </div>
                )}

                {selectedTaskId && (
                  <div className="absolute -top-6 left-2 flex items-center gap-1.5 bg-primary-50 text-primary-600 px-2 py-0.5 rounded-t-lg border-t border-x border-primary-100 animate-in slide-in-from-bottom-1">
                    <FileText className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-wider">{selectedTaskTitle}</span>
                    <button onClick={() => {setSelectedTaskId(null); setSelectedTaskTitle('');}} className="hover:text-rose-500">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                <textarea 
                   placeholder="Post an update or comment... (Type @ to link a task)"
                   className={cn(
                     "w-full rounded-2xl border border-slate-200 bg-white p-3 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm resize-none",
                     selectedTaskId && "rounded-tl-none border-t-primary-200"
                   )}
                   rows="2"
                   value={newComment}
                   onChange={handleTextChange}
                   onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handlePostComment(e);
                      }
                      if (e.key === 'Escape') {
                        setShowMentionList(false);
                      }
                   }}
                />
                <button 
                   type="submit"
                   disabled={isPostingComment || !newComment.trim()}
                   className="absolute right-3 bottom-3 p-1.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md"
                >
                   <Send className="w-3.5 h-3.5" />
                </button>
             </form>
          </div>
        </CardContent>
      </Card>
      
      <ConfirmationModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, id: null })}
        onConfirm={() => performDelete(confirmModal.id)}
        title="Delete Document"
        message="Are you sure you want to permanently delete this project document? This action cannot be undone."
        variant="danger"
        confirmText="Delete Document"
      />
    </div>
  );
};

export default ProjectResourcesModal;
