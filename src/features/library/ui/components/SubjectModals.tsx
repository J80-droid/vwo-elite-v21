import React from "react";

import { StudyMaterial } from "../../../../shared/types/study";
import { useSubjectRoomState } from "../../hooks/useSubjectRoomState";
import { SUBJECT_THEME_CONFIG } from "../../types/library.types";
import { AddContentModal } from "../modals/AddContentModal";
import { ConfigModal } from "../modals/ConfigModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { LoadSetModal } from "../modals/LoadSetModal";

interface SubjectModalsProps {
    ui: ReturnType<typeof useSubjectRoomState>;
    theme: typeof SUBJECT_THEME_CONFIG[string];
    actions: {
        handleModalSubmit: () => void;
        handleDeleteMaterial: (id: string) => void;
        handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
        handleDockAction: (id: string) => void;
        confirmDeleteLesson: () => void;
        setLessonToDelete: (id: string | null) => void;
        handleStartModule: () => void;
    };
    data: {
        materials: StudyMaterial[];
        selectedMaterials: Set<string>;
        toggleSelection: (id: string) => void;
        storeSubjectName: string;
        lessonToDelete: string | null;
        loading: boolean;
        progress: number;
        progressStatus: string;
        canStart: boolean;
    };
}

export const SubjectModals: React.FC<SubjectModalsProps> = ({ ui, theme, actions, data }) => {
    return (
        <>
            <AddContentModal
                type={ui.activeModal}
                title={ui.modalTitle}
                value={ui.modalValue}
                theme={theme}
                onClose={ui.resetModal}
                onTitleChange={ui.setModalTitle}
                onValueChange={ui.setModalValue}
                onSubmit={actions.handleModalSubmit}
            />

            <ConfigModal
                isOpen={ui.isConfigOpen}
                onClose={() => ui.setIsConfigOpen(false)}
                theme={theme}
                materials={data.materials}
                onDeleteMaterial={actions.handleDeleteMaterial}
                onFileUpload={actions.handleFileUpload}
                onDockAction={actions.handleDockAction}
                modes={ui.modes}
                onToggleMode={ui.toggleMode}
                topic={ui.topic}
                onTopicChange={ui.setTopic}
                loading={data.loading}
                progress={data.progress}
                progressStatus={data.progressStatus}
                canStart={data.canStart}
                onSubmit={actions.handleStartModule}
            />

            <DeleteConfirmModal
                isOpen={!!data.lessonToDelete}
                onClose={() => actions.setLessonToDelete(null)}
                onConfirm={actions.confirmDeleteLesson}
            />

            <LoadSetModal
                isOpen={ui.activeModal === "loadSet"}
                onClose={ui.resetModal}
                subjectName={data.storeSubjectName}
                materials={data.materials}
                selectedMaterials={data.selectedMaterials}
                toggleSelection={data.toggleSelection}
            />
        </>
    );
};
