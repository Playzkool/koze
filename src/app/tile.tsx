import { useLocalSearchParams } from 'expo-router';

import { ROOT_BOARD_ID } from '@/data/default-boards';
import { TileEditor } from '@/screens/tile-editor';

export default function TileRoute() {
  const { boardId, tileId, category } = useLocalSearchParams<{
    boardId?: string;
    tileId?: string;
    category?: string;
  }>();
  return <TileEditor boardId={boardId ?? ROOT_BOARD_ID} tileId={tileId} category={category === '1'} />;
}
