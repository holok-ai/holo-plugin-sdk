import {HoloRequest} from "@holokai/holo-types/holo";

export const HoloRequestDefaults: Partial<HoloRequest> = {
    stream: false,
    temperature: 1.0,
    top_p: 1.0,
    tool_choice: {type: 'auto'},
    response_format: {type: 'text'}
};
