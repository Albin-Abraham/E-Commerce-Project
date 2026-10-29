/**
 * Generic Interface for an Item (Card/Field)
 */
export interface Identifiable {
  id: string;
}

/**
 * Generic Interface for a Column (Section)
 * Must contain a list of Items.
 */
export interface IColumn<TItem extends Identifiable> extends Identifiable {
  items: TItem[];
}

/**
 * Generic Interface for a Board (Form)
 * Must contain a list of Columns.
 */
export interface IBoard<TColumn extends IColumn<any>> {
  columns: TColumn[];
}

/**
 * SFM (Sortable Finite Machine / Manager)
 * A pure Domain Service for managing Board-Column-Item relationships.
 *
 * TBoard: The type of the root container (e.g., FormDefinition)
 * TColumn: The type of the column (e.g., FormSection)
 * TItem: The type of the item (e.g., FormField)
 */
export class SFM<
  TItem extends Identifiable,
  TColumn extends IColumn<TItem>,
  _TBoard extends IBoard<TColumn>,
> {
  // Operations are pure functions that take a board and return a mutated board (or new state).
  // In a real Immutability setup (Immer), we just mutate the draft.

  // --- Column Operations ---

  public static addColumn<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(board: TBoard, newColumn: TColumn): void {
    board.columns.push(newColumn);
  }

  public static removeColumn<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(board: TBoard, columnId: string): void {
    board.columns = board.columns.filter((c) => c.id !== columnId) as any;
  }

  public static moveColumn<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(board: TBoard, sourceIndex: number, destIndex: number): void {
    const columns = board.columns;
    const [removed] = columns.splice(sourceIndex, 1);
    columns.splice(destIndex, 0, removed);
  }

  // --- Item Operations ---

  public static addItem<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(board: TBoard, columnId: string, newItem: TItem, index?: number): void {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return;

    if (typeof index === "number") {
      column.items.splice(index, 0, newItem);
    } else {
      column.items.push(newItem);
    }
  }

  public static removeItem<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(board: TBoard, columnId: string, itemId: string): void {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return;
    column.items = column.items.filter((i) => i.id !== itemId) as any;
  }

  public static moveItem<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(
    board: TBoard,
    columnId: string,
    sourceIndex: number,
    destIndex: number
  ): void {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return;

    const items = column.items;
    const [removed] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, removed);
  }

  public static moveItemBetweenColumns<
    TItem extends Identifiable,
    TColumn extends IColumn<TItem>,
    TBoard extends IBoard<TColumn>,
  >(
    board: TBoard,
    sourceColumnId: string,
    destColumnId: string,
    sourceIndex: number,
    destIndex: number
  ): void {
    const sourceCol = board.columns.find((c) => c.id === sourceColumnId);
    const destCol = board.columns.find((c) => c.id === destColumnId);

    if (!sourceCol || !destCol) return;

    const [movedItem] = sourceCol.items.splice(sourceIndex, 1);
    destCol.items.splice(destIndex, 0, movedItem);
  }
}
