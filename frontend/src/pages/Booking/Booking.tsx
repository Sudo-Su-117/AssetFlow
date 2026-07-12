import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X, Info, AlertOctagon, CheckCircle2, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../App';
import { fetchResourceAvailability, createBooking, cancelBooking, fetchBookings } from '../../services/booking.api';
import { fetchAssets } from '../../services/asset.api';
import type { BookingData, ResourceAvailabilityData } from '../../types/booking';

export const Booking: React.FC = () => {
  const { currentRole, email } = useAuth();
  const queryClient = useQueryClient();

  // Selected state
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().substring(0, 10); // Today's date YYYY-MM-DD
  });

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('10:00');
  const [endTimeInput, setEndTimeInput] = useState('11:00');
  const [purpose, setPurpose] = useState('');
  
  // Conflict warning banner state
  const [conflictError, setConflictError] = useState<{ msg: string; slot?: any } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Fetch Assets list (Filter for bookable resources)
  const { data: assets = [] } = useQuery({
    queryKey: ['assets', email],
    queryFn: () => fetchAssets(email),
    enabled: !!email
  });

  const bookableResources = assets.filter(a => a.bookable);

  // 2. Fetch Availability Timeline for Selected Resource and Date
  const { 
    data: availability = [], 
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline
  } = useQuery({
    queryKey: ['availability', selectedResourceId, selectedDate, email],
    queryFn: () => fetchResourceAvailability(email, selectedResourceId, selectedDate),
    enabled: !!selectedResourceId && !!selectedDate
  });

  // 3. Fetch bookings created by user to list for cancellation
  const { data: allBookings = [], refetch: refetchAll } = useQuery({
    queryKey: ['bookings', email],
    queryFn: () => fetchBookings(email),
    enabled: !!email
  });

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => createBooking(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reportsOverview'] });
      setModalOpen(false);
      setPurpose('');
      setConflictError(null);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reportsOverview'] });
    }
  });

  // Form Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setConflictError(null);

    if (!selectedResourceId) return setValidationError('Please select a resource first.');

    // Parse start and end datetimes
    const startIso = `${selectedDate}T${startTimeInput}:00.000Z`;
    const endIso = `${selectedDate}T${endTimeInput}:00.000Z`;

    const start = new Date(startIso);
    const end = new Date(endIso);

    if (start >= end) {
      return setValidationError('Start Time must be chronologically before End Time.');
    }

    try {
      await createBookingMutation.mutateAsync({
        assetId: selectedResourceId,
        startTime: startIso,
        endTime: endIso,
        purpose
      });
    } catch (err: any) {
      if (err.code === 'CONFLICT') {
        setConflictError({
          msg: err.message,
          slot: err.conflictingBooking
        });
      } else {
        setValidationError(err.message || 'Failed to create booking.');
      }
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await cancelMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  // Timeline Hour blocks: 9:00 AM to 5:00 PM
  const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  
  // Helper to map booking into absolute position offsets inside 9:00 - 17:00 container
  const getPositionStyle = (startHHMM: string, endHHMM: string) => {
    const parseToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const timelineStart = 9 * 60; // 9:00 AM in minutes
    const timelineEnd = 17 * 60;  // 5:00 PM in minutes
    const startMin = parseToMinutes(startHHMM);
    const endMin = parseToMinutes(endHHMM);

    // Limit boundaries to timeline range
    const clampedStart = Math.max(timelineStart, Math.min(timelineEnd, startMin));
    const clampedEnd = Math.max(timelineStart, Math.min(timelineEnd, endMin));

    const top = clampedStart - timelineStart; // 1 minute = 1px
    const height = clampedEnd - clampedStart;

    return {
      top: `${top}px`,
      height: `${height}px`
    };
  };

  const selectedResource = bookableResources.find(r => r.id === selectedResourceId);

  return (
    <div className="main-content">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Resource Scheduling</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Book shared meeting rooms, equipment, or vehicles. Prevents scheduling conflicts.
          </p>
        </div>
        {selectedResourceId && (
          <button className="btn btn-primary" onClick={() => { setValidationError(null); setConflictError(null); setModalOpen(true); }}>
            Book a slot
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Resource Timeline */}
        <div>
          {/* selectors */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Select Resource</label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="form-input"
                style={{ padding: '0.625rem' }}
              >
                <option value="">-- Choose Bookable Resource --</option>
                {bookableResources.map(res => (
                  <option key={res.id} value={res.id}>
                    {res.name} ({res.assetTag}) - {res.location || 'No Location'}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Select Date</label>
              <input 
                type="date" 
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '0.625rem' }}
              />
            </div>
          </div>

          {/* Timeline Centerpiece (Matches wireframe) */}
          {selectedResourceId ? (
            isLoadingTimeline ? (
              <div className="glass-card" style={{ padding: '3rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading schedule...</p>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                    Schedule for {selectedResource?.name} • {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>9:00 AM - 5:00 PM</span>
                </div>

                {/* Timeline Grid Container */}
                <div style={{ position: 'relative', height: '480px', background: 'rgba(255,255,255,0.01)', borderLeft: '1px solid var(--border-color)', marginLeft: '4rem' }}>
                  
                  {/* Grid Hours markings */}
                  {HOURS.map((hour) => {
                    const top = (hour - 9) * 60; // 60px per hour
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    const suffix = hour >= 12 ? 'PM' : 'AM';
                    return (
                      <div key={hour}>
                        {/* Hour text label */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-4rem', 
                          top: `${top - 8}px`, 
                          width: '3.5rem', 
                          textAlign: 'right', 
                          fontSize: '0.75rem', 
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 500
                        }}>
                          {displayHour}:00 {suffix}
                        </div>
                        {/* Grid line */}
                        <div style={{ 
                          position: 'absolute', 
                          left: 0, 
                          right: 0, 
                          top: `${top}px`, 
                          borderBottom: '1px dashed rgba(255,255,255,0.05)',
                          zIndex: 1
                        }} />
                      </div>
                    );
                  })}

                  {/* Absolute positioned Booking cards */}
                  {availability.filter(b => b.status !== 'CANCELLED').map((book) => {
                    const pos = getPositionStyle(book.start, book.end);
                    const isOwn = allBookings.some(ab => ab.id === book.id && ab.user?.email === email);
                    return (
                      <div
                        key={book.id}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          right: '10px',
                          top: pos.top,
                          height: pos.height,
                          background: isOwn ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isOwn ? 'var(--color-primary)' : 'var(--border-color)'}`,
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          zIndex: 10,
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-premium)'
                        }}
                        title={`${book.bookedBy} (${book.department}): ${book.purpose || 'Meeting'}`}
                      >
                        <div style={{ fontWeight: 700, color: isOwn ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {book.start} - {book.end} • {book.bookedBy} ({book.department})
                        </div>
                        {book.purpose && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {book.purpose}
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>

              </div>
            )
          ) : (
            <div className="glass-card empty-state" style={{ height: '350px' }}>
              <Calendar size={44} />
              <p style={{ marginTop: '0.5rem' }}>Select a bookable resource and choose a date to display schedules.</p>
            </div>
          )}

        </div>

        {/* Right Column: User Reservations & Cancellations */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              My Reservations
            </h3>
            
            {allBookings.filter(b => b.status === 'UPCOMING' || b.status === 'ONGOING').length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allBookings.filter(b => b.status === 'UPCOMING' || b.status === 'ONGOING').map((b) => (
                  <div 
                    key={b.id} 
                    style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '1rem' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{b.asset?.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tag: {b.asset?.assetTag}</div>
                      </div>
                      <span className={`badge ${b.status === 'UPCOMING' ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '0.7rem' }}>
                        {b.status.toLowerCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Date: <strong>{formatDate(b.startTime)}</strong>
                      <br />
                      Time: <strong>{new Date(b.startTime).toISOString().substring(11, 16)} - {new Date(b.endTime).toISOString().substring(11, 16)}</strong>
                      {b.purpose && (
                        <div style={{ marginTop: '0.35rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '0.25rem 0.5rem', borderRadius: '4px', borderLeft: '2px solid var(--border-color)' }}>
                          Purpose: "{b.purpose}"
                        </div>
                      )}
                    </div>

                    {/* Cancel action (Only if upcoming) */}
                    {b.status === 'UPCOMING' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancelMutation.isPending}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                        >
                          <X size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={28} />
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>No active bookings created by you.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* DIALOG 1: BOOKING CREATION MODAL */}
      {modalOpen && selectedResource && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Book Time Slot
              </h3>
              <button 
                onClick={() => setModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error alerts */}
            {validationError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            {/* Conflict Warning banner (Matches Wireframe) */}
            {conflictError && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.12)', 
                border: '1px solid rgba(239, 68, 68, 0.25)', 
                borderRadius: '8px', 
                padding: '1rem', 
                marginBottom: '1rem', 
                color: '#fca5a5',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertOctagon size={16} style={{ marginTop: '0.15rem', color: '#ef4444' }} />
                  <div>
                    <strong>Requested Slot Conflicts:</strong>
                    <div style={{ marginTop: '0.25rem' }}>
                      Conflicts with {conflictError.slot?.bookedBy} ({conflictError.slot?.department}) from {conflictError.slot?.start} to {conflictError.slot?.end}.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              {/* Asset Name */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div>Resource: <strong>{selectedResource.name}</strong></div>
                <div>Location: <strong>{selectedResource.location || 'No Location'}</strong></div>
              </div>

              {/* Date (Display Read Only) */}
              <div className="form-group">
                <label className="form-label">Reservation Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={selectedDate} 
                  disabled
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Start Time */}
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                  />
                </div>

                {/* End Time */}
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose / Meeting Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Weekly Procurement Sync" 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? 'Scheduling...' : 'Reserve Slot'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
