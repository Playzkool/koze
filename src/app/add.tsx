import { useLocalSearchParams } from 'expo-router';

import { ROOT_BOARD_ID } from '@/data/default-boards';
import { AddPicto } from '@/screens/add-picto';

export default function AddRoute() {
  const { boardId } = useLocalSearchParams<{ boardId?: string }>();
  return <AddPicto boardId={boardId ?? ROOT_BOARD_ID} />;
}
