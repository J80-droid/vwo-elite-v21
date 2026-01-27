/* eslint-disable react-hooks/exhaustive-deps */
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useSearchParams } from "react-router-dom";

import { LibraryProvider } from "../hooks/LibraryContext";
import { LibraryGrid } from "./LibraryGrid";
import { SubjectRoom } from "./SubjectRoom";

export { LibraryProvider } from "../hooks/LibraryContext";

export const SmartLibrary: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(
    searchParams.get("subject"),
  );

  // Sync state with URL parameter
  React.useEffect(() => {
    const subjectFromUrl = searchParams.get("subject");
    if (subjectFromUrl !== selectedSubject) {
      setSelectedSubject(subjectFromUrl);
    }
  }, [searchParams]);

  // Update URL when state changes
  const handleSelectSubject = (subject: string | null) => {
    if (subject) {
      setSearchParams({ subject });
    } else {
      setSearchParams({});
    }
    setSelectedSubject(subject);
  };

  return (
    <LibraryProvider>
      <div className="h-full bg-[#02040a] relative overflow-hidden transition-all duration-300">
        <div className="h-full w-full relative">
          <AnimatePresence mode="wait">
            {selectedSubject ? (
              <motion.div
                key="room"
                className="h-full w-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SubjectRoom
                  subjectId={selectedSubject}
                  onBack={() => handleSelectSubject(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className="h-full w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LibraryGrid onSelect={handleSelectSubject} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LibraryProvider>
  );
};
