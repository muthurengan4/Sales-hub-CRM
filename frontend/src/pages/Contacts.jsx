import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Plus, Search, Loader2, Mail, Phone, Building2, MoreHorizontal, Trash2, Edit, X, MapPin, User } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Contacts() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', company: '',
    job_title: '', linkedin: '', address: '', city: '', country: '', notes: '', tags: []
  });

  useEffect(() => { fetchContacts(); }, [search]);

  const fetchContacts = async () => {
    try {
      let url = `${API}/api/contacts`;
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setContacts(await response.json());
    } catch (error) { toast.error('Failed to fetch contacts'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.first_name) { toast.error('First name is required'); return; }
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) { toast.success('Contact created'); setIsCreateOpen(false); resetForm(); fetchContacts(); }
      else { const data = await response.json(); toast.error(data.detail || 'Failed'); }
    } catch (error) { toast.error('Failed to create contact'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedContact) return;
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) { toast.success('Contact updated'); setIsEditOpen(false); setSelectedContact(null); resetForm(); fetchContacts(); }
    } catch (error) { toast.error('Failed to update contact'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await fetch(`${API}/api/contacts/${contactId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Contact deleted'); fetchContacts();
    } catch (error) { toast.error('Failed to delete contact'); }
  };

  const openEditDialog = (contact) => {
    setSelectedContact(contact);
    setFormData({ ...contact });
    setIsEditOpen(true);
    setDropdownOpen(null);
  };

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', linkedin: '', address: '', city: '', country: '', notes: '', tags: [] });
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="elstar-modal-overlay" onClick={onClose}>
        <div className="elstar-modal animate-fade-in max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="elstar-modal-header flex items-center justify-between">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="contacts-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="elstar-btn-primary flex items-center gap-2" data-testid="add-contact-btn">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="elstar-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="elstar-input pl-10" data-testid="search-contacts-input" />
        </div>
      </div>

      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No contacts found</p>
            <p className="text-sm text-muted-foreground mb-4">Start building your customer database</p>
            <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="elstar-btn-primary"><Plus className="w-4 h-4 mr-2" />Add Contact</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="elstar-card p-4 hover:border-primary/30 transition-colors" data-testid={`contact-card-${contact.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="elstar-avatar w-10 h-10">{contact.first_name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                      <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setDropdownOpen(dropdownOpen === contact.id ? null : contact.id)} className="p-1 hover:bg-secondary rounded">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {dropdownOpen === contact.id && (
                      <>
                        <div className="fixed inset-0" onClick={() => setDropdownOpen(null)} />
                        <div className="elstar-dropdown animate-fade-in">
                          <button onClick={() => openEditDialog(contact)} className="elstar-dropdown-item w-full text-left flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                          <button onClick={() => { handleDelete(contact.id); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500"><Trash2 className="w-4 h-4" /> Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {contact.company && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="w-4 h-4" />{contact.company}</div>}
                  {contact.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" /><span className="truncate">{contact.email}</span></div>}
                  {contact.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{contact.phone}</div>}
                  {contact.city && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{contact.city}, {contact.country}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Contact">
        <form onSubmit={handleCreate}>
          <div className="elstar-modal-body space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">First Name *</label><input className="elstar-input" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} data-testid="contact-first-name" /></div>
              <div><label className="block text-sm font-medium mb-2">Last Name</label><input className="elstar-input" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Email</label><input className="elstar-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} data-testid="contact-email" /></div>
              <div><label className="block text-sm font-medium mb-2">Phone</label><input className="elstar-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Company</label><input className="elstar-input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-2">Job Title</label><input className="elstar-input" value={formData.job_title} onChange={(e) => setFormData({...formData, job_title: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">City</label><input className="elstar-input" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-2">Country</label><input className="elstar-input" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-2">Notes</label><textarea className="elstar-input min-h-[80px]" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="submit-contact-btn">{formLoading && <Loader2 className="w-4 h-4 animate-spin" />}Create Contact</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Contact">
        <form onSubmit={handleEdit}>
          <div className="elstar-modal-body space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">First Name *</label><input className="elstar-input" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-2">Last Name</label><input className="elstar-input" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Email</label><input className="elstar-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-2">Phone</label><input className="elstar-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Company</label><input className="elstar-input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-2">Job Title</label><input className="elstar-input" value={formData.job_title} onChange={(e) => setFormData({...formData, job_title: e.target.value})} /></div>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2">{formLoading && <Loader2 className="w-4 h-4 animate-spin" />}Update Contact</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
