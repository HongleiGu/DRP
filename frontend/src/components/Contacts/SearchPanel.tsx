import { Input, Modal, Spin } from "antd";
import SearchList from "./SearchList";
import { SupabaseUser } from "@/types/datatypes";
import { debounce } from "lodash";
import { findUserByIdentifierBlur } from "@/utils/user";
import { useEffect, useState } from "react";
import { parseJsonlToTypedObjects } from "@/utils/json";
import { getContactsFilePath } from "@/utils/fileService/commonFilePaths";

// Interface for SearchPanel props
interface SearchPanelProps {
  currentUser: SupabaseUser;  // The currently logged-in user
  open: boolean;  // Flag to open/close the search panel
  onClose: () => void;  // Function to close the search panel
  send: (currentUser: SupabaseUser, target: SupabaseUser) => Promise<void>
}


// Search contact modal
export function SearchPanel({
  currentUser,
  open,
  onClose,
  send
}: SearchPanelProps) {
  // Debounced search function (ensures that search happens only after typing stops)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchList, setSearchList] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [contactList, setContactList] = useState<SupabaseUser[]>([]);
  const handleSearch =
    debounce(async (query: string) => {
      setLoading(true)
      const users = await findUserByIdentifierBlur(query);
      setSearchList(users.filter(u => u.id !== currentUser.id)); // Exclude self
      setLoading(false)
    }, 100)

    // Handle input change (trigger debounce search)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value); // Update the query
    handleSearch(value);  // Trigger the debounced search
  };

  useEffect(() => {
    const helper = async () => {
      if (!open) return // we dont need to fetch when this is not openned
      const contacts = await parseJsonlToTypedObjects<SupabaseUser>(getContactsFilePath(currentUser.id))
      // const pending = await parseJsonlToTypedObjects<SupabaseUser>(getPendingFilePath(currentUser.id))
      // setPendingList(pending)
      setContactList(contacts)
    }
    helper()
  }, [open, currentUser.id])

  return (
    <Modal
      open={open}
      title="Add New Contact"
      onCancel={
        // () => setModalOpen(false)
        onClose
      }
      footer={null}
      className="w-full max-w-md mx-auto"
      style={{ top: 20 }}
    >
      <div className="flex flex-col gap-6">
        {/* Search input */}
        <div className="w-full">
          <Input
            placeholder="Search Contacts"
            value={searchQuery}
            onChange={handleChange}
            allowClear
            size="large"
            style={{ borderRadius: 8 }}
          />
        </div>

        {/* Render contacts list based on the search query */}
        <div className="w-full max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            <SearchList 
              currentUser={currentUser} 
              searchList={searchList} 
              contactsList={contactList} 
              send={send}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}