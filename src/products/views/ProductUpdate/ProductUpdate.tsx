import DialogContentText from "@material-ui/core/DialogContentText";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import placeholderImg from "@assets/images/placeholder255x255.png";
import ActionDialog from "@saleor/components/ActionDialog";
import { WindowTitle } from "@saleor/components/WindowTitle";
import useBulkActions from "@saleor/hooks/useBulkActions";
import useNavigator from "@saleor/hooks/useNavigator";
import useNotifier from "@saleor/hooks/useNotifier";
import { commonMessages } from "@saleor/intl";
import { DEFAULT_INITIAL_SEARCH_DATA } from "../../../config";
import SearchCategories from "../../../containers/SearchCategories";
import SearchCollections from "../../../containers/SearchCollections";
import { getMutationState, maybe } from "../../../misc";
import ProductUpdatePage from "../../components/ProductUpdatePage";
import ProductUpdateOperations from "../../containers/ProductUpdateOperations";
import { TypedProductDetailsQuery } from "../../queries";
import {
  ProductImageCreate,
  ProductImageCreateVariables
} from "../../types/ProductImageCreate";
import { ProductUpdate as ProductUpdateMutationResult } from "../../types/ProductUpdate";
import { ProductVariantBulkDelete } from "../../types/ProductVariantBulkDelete";
import {
  productImageUrl,
  productListUrl,
  productUrl,
  ProductUrlDialog,
  ProductUrlQueryParams,
  productVariantAddUrl,
  productVariantEditUrl
} from "../../urls";
import {
  createImageReorderHandler,
  createImageUploadHandler,
  createUpdateHandler
} from "./handlers";

interface ProductUpdateProps {
  id: string;
  params: ProductUrlQueryParams;
}

export const ProductUpdate: React.StatelessComponent<ProductUpdateProps> = ({
  id,
  params
}) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const { isSelected, listElements, reset, toggle, toggleAll } = useBulkActions(
    params.ids
  );
  const intl = useIntl();

  const openModal = (action: ProductUrlDialog) =>
    navigate(
      productUrl(id, {
        action
      })
    );

  return (
    <SearchCategories variables={DEFAULT_INITIAL_SEARCH_DATA}>
      {({ search: searchCategories, result: searchCategoriesOpts }) => (
        <SearchCollections variables={DEFAULT_INITIAL_SEARCH_DATA}>
          {({ search: searchCollections, result: searchCollectionsOpts }) => (
            <TypedProductDetailsQuery
              displayLoader
              require={["product"]}
              variables={{ id }}
            >
              {({ data, loading, refetch }) => {
                const handleDelete = () => {
                  notify({
                    text: intl.formatMessage({
                      defaultMessage: "Product removed"
                    })
                  });
                  navigate(productListUrl());
                };
                const handleUpdate = (data: ProductUpdateMutationResult) => {
                  if (data.productUpdate.errors.length === 0) {
                    notify({
                      text: intl.formatMessage(commonMessages.savedChanges)
                    });
                  } else {
                    const attributeError = data.productUpdate.errors.find(
                      err => err.field === "attributes"
                    );
                    if (!!attributeError) {
                      notify({ text: attributeError.message });
                    }
                  }
                };

                const handleImageCreate = (data: ProductImageCreate) => {
                  const imageError = data.productImageCreate.errors.find(
                    error =>
                      error.field ===
                      ("image" as keyof ProductImageCreateVariables)
                  );
                  if (imageError) {
                    notify({
                      text: imageError.message
                    });
                  }
                };
                const handleImageDeleteSuccess = () =>
                  notify({
                    text: intl.formatMessage(commonMessages.savedChanges)
                  });
                const handleVariantAdd = () =>
                  navigate(productVariantAddUrl(id));

                const handleBulkProductVariantDelete = (
                  data: ProductVariantBulkDelete
                ) => {
                  if (data.productVariantBulkDelete.errors.length === 0) {
                    navigate(productUrl(id), true);
                    reset();
                    refetch();
                  }
                };

                const product = data ? data.product : undefined;
                return (
                  <ProductUpdateOperations
                    product={product}
                    onBulkProductVariantDelete={handleBulkProductVariantDelete}
                    onDelete={handleDelete}
                    onImageCreate={handleImageCreate}
                    onImageDelete={handleImageDeleteSuccess}
                    onUpdate={handleUpdate}
                  >
                    {({
                      bulkProductVariantDelete,
                      createProductImage,
                      deleteProduct,
                      deleteProductImage,
                      reorderProductImages,
                      updateProduct,
                      updateSimpleProduct
                    }) => {
                      const handleImageDelete = (id: string) => () =>
                        deleteProductImage.mutate({ id });
                      const handleImageEdit = (imageId: string) => () =>
                        navigate(productImageUrl(id, imageId));
                      const handleSubmit = createUpdateHandler(
                        product,
                        updateProduct.mutate,
                        updateSimpleProduct.mutate
                      );
                      const handleImageUpload = createImageUploadHandler(
                        id,
                        createProductImage.mutate
                      );
                      const handleImageReorder = createImageReorderHandler(
                        product,
                        reorderProductImages.mutate
                      );

                      const disableFormSave =
                        createProductImage.opts.loading ||
                        deleteProduct.opts.loading ||
                        reorderProductImages.opts.loading ||
                        updateProduct.opts.loading ||
                        loading;
                      const formTransitionState = getMutationState(
                        updateProduct.opts.called ||
                          updateSimpleProduct.opts.called,
                        updateProduct.opts.loading ||
                          updateSimpleProduct.opts.loading,
                        maybe(
                          () => updateProduct.opts.data.productUpdate.errors
                        ),
                        maybe(
                          () =>
                            updateSimpleProduct.opts.data.productUpdate.errors
                        ),
                        maybe(
                          () =>
                            updateSimpleProduct.opts.data.productVariantUpdate
                              .errors
                        )
                      );
                      const deleteTransitionState = getMutationState(
                        deleteProduct.opts.called,
                        deleteProduct.opts.loading,
                        maybe(
                          () => deleteProduct.opts.data.productDelete.errors
                        )
                      );

                      const bulkProductVariantDeleteTransitionState = getMutationState(
                        bulkProductVariantDelete.opts.called,
                        bulkProductVariantDelete.opts.loading,
                        maybe(
                          () =>
                            bulkProductVariantDelete.opts.data
                              .productVariantBulkDelete.errors
                        )
                      );

                      const categories = maybe(
                        () => searchCategoriesOpts.data.categories.edges,
                        []
                      ).map(edge => edge.node);
                      const collections = maybe(
                        () => searchCollectionsOpts.data.collections.edges,
                        []
                      ).map(edge => edge.node);
                      const errors = maybe(
                        () => updateProduct.opts.data.productUpdate.errors,
                        []
                      );

                      return (
                        <>
                          <WindowTitle title={maybe(() => data.product.name)} />
                          <ProductUpdatePage
                            categories={categories}
                            collections={collections}
                            disabled={disableFormSave}
                            errors={errors}
                            fetchCategories={searchCategories}
                            fetchCollections={searchCollections}
                            saveButtonBarState={formTransitionState}
                            images={maybe(() => data.product.images)}
                            header={maybe(() => product.name)}
                            placeholderImage={placeholderImg}
                            product={product}
                            variants={maybe(() => product.variants)}
                            onBack={() => {
                              navigate(productListUrl());
                            }}
                            onDelete={() => openModal("remove")}
                            onProductShow={() => {
                              if (product) {
                                window.open(product.url);
                              }
                            }}
                            onImageReorder={handleImageReorder}
                            onSubmit={handleSubmit}
                            onVariantAdd={handleVariantAdd}
                            onVariantShow={variantId => () =>
                              navigate(
                                productVariantEditUrl(product.id, variantId)
                              )}
                            onImageUpload={handleImageUpload}
                            onImageEdit={handleImageEdit}
                            onImageDelete={handleImageDelete}
                            toolbar={
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  navigate(
                                    productUrl(id, {
                                      action: "remove-variants",
                                      ids: listElements
                                    })
                                  )
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                            isChecked={isSelected}
                            selected={listElements.length}
                            toggle={toggle}
                            toggleAll={toggleAll}
                          />
                          <ActionDialog
                            open={params.action === "remove"}
                            onClose={() => navigate(productUrl(id), true)}
                            confirmButtonState={deleteTransitionState}
                            onConfirm={() => deleteProduct.mutate({ id })}
                            variant="delete"
                            title={intl.formatMessage({
                              defaultMessage: "Delete Product",
                              description: "dialog header"
                            })}
                          >
                            <DialogContentText>
                              <FormattedMessage
                                defaultMessage="Are you sure you want to delete {name}?"
                                description="delete product"
                                values={{
                                  name: product ? product.name : undefined
                                }}
                              />
                            </DialogContentText>
                          </ActionDialog>
                          <ActionDialog
                            open={params.action === "remove-variants"}
                            onClose={() => navigate(productUrl(id), true)}
                            confirmButtonState={
                              bulkProductVariantDeleteTransitionState
                            }
                            onConfirm={() =>
                              bulkProductVariantDelete.mutate({
                                ids: params.ids
                              })
                            }
                            variant="delete"
                            title={intl.formatMessage({
                              defaultMessage: "Delete Product Variants",
                              description: "dialog header"
                            })}
                          >
                            <DialogContentText>
                              <FormattedMessage
                                defaultMessage="Are you sure you want to delete {counter, plural,
            one {this variant}
            other {{displayQuantity} variants}
          }?"
                                description="dialog content"
                                values={{
                                  counter: maybe(() => params.ids.length),
                                  displayQuantity: (
                                    <strong>
                                      {maybe(() => params.ids.length)}
                                    </strong>
                                  )
                                }}
                              />
                            </DialogContentText>
                          </ActionDialog>
                        </>
                      );
                    }}
                  </ProductUpdateOperations>
                );
              }}
            </TypedProductDetailsQuery>
          )}
        </SearchCollections>
      )}
    </SearchCategories>
  );
};
export default ProductUpdate;
