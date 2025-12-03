import { useMemo, useState } from 'react';

import { defineRouteConfig } from '@medusajs/admin-sdk';
import { ArrowUpRightOnBox, Gift, Trash } from '@medusajs/icons';
import {
  Container,
  DataTable,
  DataTablePaginationState,
  DataTableRowSelectionState,
  DataTableSortingState,
  Heading,
  IconButton,
  Text,
  Toaster,
  createDataTableColumnHelper,
  createDataTableCommandHelper,
  toast,
  useDataTable,
  usePrompt,
} from '@medusajs/ui';
import { useQuery } from '@tanstack/react-query';

import { Reward } from '../../../types/loyalty';
import { CreateRewardForm } from '../../components/rewards/create-reward-form';
import { sdk } from '../../lib/sdk';

type RewardsResponse = {
  rewards: Reward[];
  count: number;
  limit: number;
  offset: number;
};

const deleteReward = async (rewardId: string) => {
  return await sdk.client.fetch(`/admin/rewards`, {
    method: 'DELETE',
    body: {
      id: rewardId,
    },
  });
};

const columnHelper = createDataTableColumnHelper<Reward>();

const columnsInitial = [
  columnHelper.select(),
  columnHelper.accessor('product', {
    header: 'Reward Item',
    cell: ({ getValue }) => {
      const product = getValue();

      const openProduct = () => {
        window.location.href = `/app/products/${product.id}`;
      };

      if (!product)
        return (
          <div className="flex h-full w-full items-center gap-x-3 overflow-hidden">
            <Text className="text-red-500">
              No product associated with this reward item yet
            </Text>
          </div>
        );

      return (
        <div className="flex h-full w-full items-center gap-x-3 overflow-hidden">
          <div className="w-fit flex-shrink-0">
            <div className="bg-ui-bg-component border-ui-border-base flex h-8 w-6 items-center justify-center overflow-hidden rounded border">
              <img
                className="h-full w-full object-cover object-center"
                src={product.thumbnail ?? product.images[0].url}
              />
            </div>
          </div>
          <Text>{product.title}</Text>
          <IconButton
            onClick={openProduct}
            variant="transparent"
            size="2xsmall"
          >
            <ArrowUpRightOnBox />
          </IconButton>
        </div>
      );
    },
  }),
  columnHelper.accessor('points_cost', {
    header: 'Points Cost',
    enableSorting: true,
    sortAscLabel: 'Lowest - Highest',
    sortDescLabel: 'Highest - Lowest',
  }),
  columnHelper.accessor('id', {
    header: 'ID',
  }),
];

const commandHelper = createDataTableCommandHelper();

type UseCommandsProps = {
  refetchData: () => void;
  setRowSelection: React.Dispatch<
    React.SetStateAction<DataTableRowSelectionState>
  >;
};

const useCommands = ({ refetchData, setRowSelection }: UseCommandsProps) => {
  return [
    commandHelper.command({
      label: 'Delete',
      shortcut: 'D',
      action: async (selection) => {
        const productsToDeleteIds = Object.keys(selection);
        const promises = productsToDeleteIds.map(
          async (id) => await deleteReward(id)
        );

        const results = await Promise.all(promises);

        if ((results[0] as { deleted: boolean }).deleted) {
          refetchData();
          setRowSelection({});
          toast.success(`Successfully deleted ${results.length} reward items`);
        }
      },
    }),
  ];
};

const RewardsPage = () => {
  const limit = 15;
  const dialog = usePrompt();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {}
  );

  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const { data, isLoading, refetch } = useQuery<RewardsResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/rewards`, {
        method: 'GET',
        query: {
          limit,
          offset,
          order: sorting
            ? `${sorting.desc ? '-' : ''}${sorting.id}`
            : undefined,
        },
      }),
    queryKey: [['rewards', limit, offset, sorting]],
  });

  const commands = useCommands({
    refetchData: refetch,
    setRowSelection,
  });

  const columns = useMemo(() => {
    return [
      ...columnsInitial,
      columnHelper.action({
        actions: [
          {
            label: 'Delete',
            onClick: async (props) => {
              const userHasConfirmed = await dialog({
                title: 'Please confirm',
                description:
                  'Are you sure you want to do delete this reward item?',
              });

              if (userHasConfirmed) {
                const result = await deleteReward(props.row.id);

                if ((result as { deleted: boolean }).deleted) {
                  refetch();
                  toast.success('Reward item successfully deleted!');
                }
              }
            },
            icon: <Trash className="text-ui-fg-subtle" />,
          },
        ],
      }),
    ];
  }, [columnsInitial, columnHelper, dialog]);

  const table = useDataTable({
    columns,
    data: data?.rewards || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    sorting: {
      state: sorting,
      onSortingChange: setSorting,
    },
    commands,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Rewards</Heading>
          <div className="flex">
            <CreateRewardForm refetch={refetch} />
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
        <DataTable.CommandBar selectedLabel={(count) => `${count} selected`} />
      </DataTable>
      <Toaster />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: 'Rewards',
  icon: Gift,
});

export default RewardsPage;
