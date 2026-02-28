import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '此操作不可撤销，确定继续吗？',
  confirmText = '确定',
  cancelText = '取消',
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <Dialog.Title className="text-lg font-semibold text-gray-800">
                  {title}
                </Dialog.Title>
              </div>
              <p className="mt-3 text-sm text-gray-600">{message}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  {confirmText}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}