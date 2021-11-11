import {getBee, injectStore, setBee, useBee} from '../../store/core';
import { centralEventBus } from '../../helpers/eventbus';
import { List } from 'immutable';

interface Snapshot {
  id: string;
  base64: string;
}

const snapshotToken = injectStore<Snapshot | null>('snapshot', null);
const snapshotsToken = injectStore<List<Snapshot>>('snapshots', List([]));

centralEventBus.on('screenshot').subscribe(res => {
  setBee(snapshotToken, res.message);
  let snapshots = getBee(snapshotsToken);
  if (snapshots.size >= 6) {
    snapshots = snapshots.shift();
  }
  snapshots = snapshots.push(res.message);
  setBee(snapshotsToken, snapshots);
});

export const useSnapshot = () => {
  const [snapshot] = useBee(snapshotToken);
  return snapshot;
};
