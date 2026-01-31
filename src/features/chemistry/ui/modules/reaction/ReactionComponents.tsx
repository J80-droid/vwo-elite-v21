import React from "react";

import { ReactionLab } from "../../../../simulation";

export const ReactionSidebar: React.FC = () => <ReactionLab mode="controls" />;

export const ReactionStage: React.FC = () => <ReactionLab mode="stage" />;
