import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

interface DeleteConfirmationProps {
  itemId: string;
  itemName: string;
  onDelete: (id: string) => Promise<void>;
  onCancel: () => void;
  onUndo: () => void;
  undoTimeSeconds?: number;
}

export default function DeleteConfirmation({
  itemId,
  itemName,
  onDelete,
  onCancel,
  onUndo,
  undoTimeSeconds = 6
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [countdown, setCountdown] = useState(undoTimeSeconds);

  useEffect(() => {
    if (isDeleted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isDeleted, countdown]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(itemId);
      setIsDeleted(true);

      // Auto-close after countdown reaches 0
      setTimeout(() => {
        if (countdown <= 0) {
          onCancel();
        }
      }, undoTimeSeconds * 1000);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndo = () => {
    setIsDeleted(false);
    onUndo();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        {!isDeleted ? (
          // Confirmation dialog
          <>
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Deletion
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold">{itemName}</span>? 
              This action cannot be undone immediately.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          // Deleted state with undo option
          <>
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Item Deleted
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <span className="font-semibold">{itemName}</span> has been deleted.
              You can undo this action for {countdown} {countdown === 1 ? 'second' : 'seconds'}.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleUndo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Undo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
