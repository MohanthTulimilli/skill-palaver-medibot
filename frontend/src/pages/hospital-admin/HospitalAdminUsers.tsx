import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Eye, EyeOff, Pencil, Trash2, X, Search, Users } from 'lucide-react';
import { UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  specialization: string | null;
  specialization_tags: string | null;
  status: string;
  created_at: string;
}

const DOCTOR_SPECIALIZATIONS = [
  'General Practitioner (GP)',
  'Pediatrician',
  'Cardiologist',
  'Psychiatrist',
  'Orthopedic Surgeon',
  'Neurosurgeon',
  'Cardiac Surgeon',
  'Dermatologist',
  'Obstetrician/Gynecologist',
  'Oncologist',
];

const roleBadgeColor: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-primary/10 text-primary',
  [UserRole.HOSPITAL_ADMIN]: 'bg-secondary/10 text-secondary-foreground',
  [UserRole.BILLING]: 'bg-accent/10 text-accent',
  [UserRole.INSURANCE]: 'bg-secondary/10 text-secondary-foreground',
  [UserRole.AI_ANALYST]: 'bg-primary/10 text-primary',
  [UserRole.PATIENT]: 'bg-muted text-muted-foreground',
  [UserRole.DOCTOR]: 'bg-accent/10 text-accent',
};

const STAFF_ROLES = [
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'BILLING', label: 'Billing Staff' },
  { value: 'INSURANCE', label: 'Insurance Agent' },
  { value: 'AI_ANALYST', label: 'AI Analyst' },
];

const HospitalAdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DOCTOR', specialization: '' });

  // Edit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', specialization: '', specialization_tags: '' });
  const [updating, setUpdating] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!user?.hospitalId) return;
    setLoading(true);
    const profiles = await api<{ id: string; user_id: string; name: string; email: string; specialization: string | null; specialization_tags: string | null; status: string; created_at: string; role: string }[]>('/api/profiles');
    const byHospital = profiles.filter((p: any) => p.hospital_id === user.hospitalId);
    setUsers(byHospital.map(p => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      email: p.email,
      specialization: p.specialization || null,
      specialization_tags: p.specialization_tags || null,
      status: p.status || 'ACTIVE',
      created_at: p.created_at,
      role: (p.role || UserRole.PATIENT) as UserRole,
    })));
    setLoading(false);
  }, [user?.hospitalId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (body: Record<string, unknown>) => {
    await api('/api/admin/create-user', { method: 'POST', body: JSON.stringify(body) });
  };
  const updateUser = async (userId: string, body: Record<string, unknown>) => {
    await api(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(body) });
  };

  // ── Create ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body: Record<string, string | undefined> = {
        name: form.name, email: form.email, password: form.password,
        role: form.role, hospital_id: user?.hospitalId,
      };
      if (form.role === 'DOCTOR') body.specialization = form.specialization;
      await createUser(body);
      toast({ title: 'Staff created', description: `${form.name} (${form.role}) added.` });
      setForm({ name: '', email: '', password: '', role: 'DOCTOR', specialization: '' });
      setDialogOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──
  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, password: '', specialization: u.specialization || '', specialization_tags: u.specialization_tags || '' });
    setShowEditPw(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setUpdating(true);
    try {
      await updateUser(editUser.user_id, {
        name: editForm.name,
        specialization: editForm.specialization || null,
        specialization_tags: editForm.specialization_tags || null,
        hospital_id: user?.hospitalId,
      });
      toast({ title: 'Staff updated', description: `${editForm.name} has been updated.` });
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Update failed', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      toast({ title: 'Not available', description: 'Delete user is not implemented in this version.', variant: 'destructive' });
      setDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtering ──
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const staffCount = users.length;
  const roleGroups = STAFF_ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length }));

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {staffCount} staff member{staffCount !== 1 ? 's' : ''} at {user?.hospitalName || 'your hospital'}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Create Staff Account</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" required
                    placeholder={
                      form.role === 'DOCTOR' ? 'id@doctor.medibots.com' :
                      form.role === 'BILLING' ? 'id@billingcare.medibots.com' :
                      form.role === 'INSURANCE' ? 'id@insurance.medibots.com' :
                      form.role === 'AI_ANALYST' ? 'id@analyst.medibots.com' : ''
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must match role domain (e.g. @doctor.medibots.com)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field pr-10" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
                    {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                {form.role === 'DOCTOR' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Specialization</label>
                    <select value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className="input-field" required>
                      <option value="">Select specialization…</option>
                      {DOCTOR_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit" disabled={creating} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Staff Account'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {roleGroups.map((r, i) => (
            <motion.div key={r.value} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => setRoleFilter(roleFilter === r.value ? 'all' : r.value)}
              className={`kpi-card cursor-pointer transition-all hover-lift ${roleFilter === r.value ? 'ring-2 ring-primary' : ''}`}>
              <p className="text-xs text-muted-foreground">{r.label}s</p>
              <p className="text-xl font-bold text-foreground mt-1">{r.count}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="input-field pl-10" />
        </div>

        {/* Staff Table */}
        <div className="table-container">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Specialization</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-xs font-bold text-primary-foreground">{u.name?.charAt(0) || '?'}</span>
                          </div>
                          <span className="truncate max-w-[140px]">{u.name || 'Unnamed'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${roleBadgeColor[u.role]}`}>{u.role.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.specialization && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold border border-accent/20">
                              🩺 {u.specialization}
                            </span>
                          )}
                          {u.specialization_tags && u.specialization_tags.split(',').map((tag, i) => (
                            <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{tag.trim()}</span>
                          ))}
                          {!u.specialization && !u.specialization_tags && <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteUser(u)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        {users.length === 0 ? 'No staff yet. Click "Add Staff" to create accounts.' : 'No matching staff found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Edit Modal ── */}
        <AnimatePresence>
          {editUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={() => setEditUser(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Edit Staff</h3>
                  <button onClick={() => setEditUser(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`status-badge ${roleBadgeColor[editUser.role]}`}>{editUser.role.replace(/_/g, ' ')}</span>
                  {editUser.specialization && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                      🩺 {editUser.specialization}
                    </span>
                  )}
                </div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></label>
                    <div className="relative">
                      <input type={showEditPw ? 'text' : 'password'} value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="input-field pr-10" minLength={6} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowEditPw(!showEditPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showEditPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {editUser.role === UserRole.DOCTOR && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Primary Specialization</label>
                        <select value={editForm.specialization} onChange={e => setEditForm(f => ({ ...f, specialization: e.target.value }))} className="input-field">
                          <option value="">None</option>
                          {DOCTOR_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Specialization Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></label>
                        <input type="text" value={editForm.specialization_tags} onChange={e => setEditForm(f => ({ ...f, specialization_tags: e.target.value }))} className="input-field" placeholder="e.g. Cardiology, General Medicine" />
                        <p className="text-xs text-muted-foreground mt-1">Add multiple specializations or sub-specialties</p>
                      </div>
                    </>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={updating} className="flex-1 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                      {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Delete Confirmation Modal ── */}
        <AnimatePresence>
          {deleteUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={() => setDeleteUser(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-destructive">Delete Staff</h3>
                  <button onClick={() => setDeleteUser(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 mb-4">
                  <p className="text-sm text-foreground">
                    Are you sure you want to permanently delete <strong>{deleteUser.name}</strong>?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will remove their account, profile, and all associated data. This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-primary-foreground">{deleteUser.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{deleteUser.name}</p>
                    <p className="text-xs text-muted-foreground">{deleteUser.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteUser(null)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default HospitalAdminUsers;
