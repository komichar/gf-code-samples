export function getReportType(state) {
  if (!state.study.data) {
    return null;
  }

  return state.study.data.reportTypeId;
}

export function getClientsWithAccess(state) {
  try {
    return state.study.data.clientsWithAccess;
  } catch (e) {
    return null;
  }
}

export function getStudyUUID(state) {
  try {
    return state.study.data.uuid;
  } catch (e) {
    return null;
  }
}
