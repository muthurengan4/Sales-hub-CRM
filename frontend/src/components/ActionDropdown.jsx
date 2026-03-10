import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function ActionDropdown({ children, testId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 192; // w-48 = 12rem = 192px
      
      // Calculate position - prefer right-aligned, but flip if near edge
      let left = rect.right - dropdownWidth;
      if (left < 8) left = rect.left;
      
      // Position below the button
      let top = rect.bottom + 8;
      
      // Check if dropdown would go below viewport
      const viewportHeight = window.innerHeight;
      const estimatedDropdownHeight = 200; // Approximate height
      if (top + estimatedDropdownHeight > viewportHeight) {
        top = rect.top - estimatedDropdownHeight - 8;
      }
      
      setPosition({ top, left });
    }
  }, [isOpen]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-secondary rounded-lg"
        data-testid={testId}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="fixed w-48 bg-card rounded-lg border border-border shadow-xl z-[70] overflow-hidden animate-fade-in"
            style={{ 
              top: position.top,
              left: position.left,
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3), 0 0 20px -5px rgba(245,199,122,0.1)'
            }}
          >
            {typeof children === 'function' ? children(() => setIsOpen(false)) : children}
          </div>
        </>
      )}
    </>
  );
}
