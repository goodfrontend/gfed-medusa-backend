import { useState } from 'react';

import { Controller, FormProvider, useForm } from 'react-hook-form';
import * as zod from 'zod';

import { PlusMini } from '@medusajs/icons';
import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Toaster,
  toast,
} from '@medusajs/ui';

import type { Reward } from '../../../types/loyalty';
import { sdk } from '../../lib/sdk';

const createRewardSchema = zod.object({
  points_cost: zod.number(),
  product_id: zod.string(),
});

type CreateRewardSchemaType = zod.infer<typeof createRewardSchema>;

type CreateRewardFormProps = {
  refetch: () => void;
};

export const CreateRewardForm = ({ refetch }: CreateRewardFormProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateRewardSchemaType>({
    defaultValues: {
      points_cost: 0,
    },
  });

  const handleSubmit = form.handleSubmit(
    async ({ points_cost, product_id }) => {
      const result = await sdk.client.fetch<{ reward: Reward }>(
        '/admin/rewards',
        {
          method: 'POST',
          body: {
            points_cost: Number(points_cost),
            product_id,
          },
        }
      );

      if (result.reward.id) {
        refetch();

        toast.success('Success', {
          description: 'The new reward item has been created.',
        });

        setOpen(false);
      }
    }
  );

  return (
    <>
      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Trigger asChild>
          <Button size="small" variant="secondary">
            <PlusMini />
            Create
          </Button>
        </FocusModal.Trigger>
        <FocusModal.Content>
          <FormProvider {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex h-full flex-col overflow-hidden"
            >
              <FocusModal.Header>
                <div className="flex items-center justify-end gap-x-2">
                  <FocusModal.Close asChild>
                    <Button size="small" variant="secondary">
                      Cancel
                    </Button>
                  </FocusModal.Close>
                  <Button type="submit" size="small">
                    Save
                  </Button>
                </div>
              </FocusModal.Header>
              <FocusModal.Body>
                <div className="flex flex-1 flex-col items-center overflow-y-auto">
                  <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
                    <div>
                      <Heading className="capitalize">
                        Create Reward Item
                      </Heading>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        control={form.control}
                        name="points_cost"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Points Cost
                                </Label>
                              </div>
                              <Input {...field} />
                            </div>
                          );
                        }}
                      />
                      <Controller
                        control={form.control}
                        name="product_id"
                        render={({ field }) => {
                          return (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-x-1">
                                <Label size="small" weight="plus">
                                  Product ID
                                </Label>
                              </div>
                              <Input {...field} />
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </FocusModal.Body>
            </form>
          </FormProvider>
        </FocusModal.Content>
      </FocusModal>
      <Toaster />
    </>
  );
};
