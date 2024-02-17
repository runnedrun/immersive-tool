import { isPromise } from "@/lib/helpers/isPromise";
import { MoreVert } from "@mui/icons-material";
import {
  CircularProgress,
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type LabelAndId =
  | {
      label: React.ReactNode;
      id: string;
    }
  | {
      label: string;
      id?: string;
    };

export type MenuOption = {
  action: (
    e: ReactMouseEvent<HTMLElement, MouseEvent>
  ) => Promise<void> | void | string | boolean;
  bindAnaltyics?: object;
  disabled?: boolean;
} & LabelAndId;

export type PopupOptions = {
  autoFocus?: boolean;
};
export const PopupMenu = ({
  options,
  controlComponent = (
    <IconButton>
      <MoreVert />
    </IconButton>
  ),
  popupOptions = {},
  onClose = () => {},
  onOpen = () => {},
  mountTo,
  disablePortal = true,
}: {
  options: MenuOption[];
  controlComponent?: JSX.Element;
  popupOptions?: PopupOptions;
  onClose?: () => void;
  onOpen?: () => void;
  mountTo?: React.RefObject<HTMLDivElement>;
  disablePortal?: boolean;
}) => {
  const [isLoadingMap, setIsLoadingMap] = useState(
    {} as Record<string, boolean>
  );
  const [confirmationMessageMap, setConfirmationMessageMap] = useState(
    {} as Record<string, string>
  );

  options.forEach((option) => {
    option.id = option.id || option.label?.toString();
  });

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorRefToUse = anchorRef || mountTo;

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  useEffect(() => {
    if (open) {
      onOpen();
    } else {
      onClose();
    }
  }, [open]);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const hasOptions = options.length > 0;

  return hasOptions ? (
    <div>
      <div className="h-fit w-fit" ref={anchorRef} onClick={handleToggle}>
        {controlComponent}
      </div>
      <Popper
        open={open}
        anchorEl={anchorRefToUse.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal={disablePortal}
        className="z-10"
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={popupOptions.autoFocus}
                  id="composition-menu"
                  aria-labelledby="composition-button"
                  onKeyDown={handleListKeyDown}
                  autoFocus
                >
                  {options.map((option) => {
                    return (
                      <MenuItem
                        disabled={option.disabled}
                        {...(option.bindAnaltyics || {})}
                        key={option.id}
                        className="normal-case"
                        onClick={async (e) => {
                          const res = option.action(e);
                          if (isPromise(res)) {
                            setIsLoadingMap((isLoadingMap) => ({
                              ...isLoadingMap,
                              [option.id || ""]: true,
                            }));
                            await res;
                            setIsLoadingMap((isLoadingMap) => ({
                              ...isLoadingMap,
                              [option.id || ""]: false,
                            }));
                          } else if (typeof res === "string") {
                            setConfirmationMessageMap(
                              (confirmationMessageMap) => ({
                                ...confirmationMessageMap,
                                [option.id || ""]: res,
                              })
                            );
                            setTimeout(() => {
                              setConfirmationMessageMap(
                                (confirmationMessageMap) => ({
                                  ...confirmationMessageMap,
                                  [option.id || ""]: null as any,
                                })
                              );
                              handleClose(e);
                            }, 3000);
                            return;
                          } else if (res === true) {
                            return;
                          }
                          handleClose(e);
                        }}
                      >
                        <div>
                          {confirmationMessageMap[option.id || ""] ||
                            option.label}
                          {isLoadingMap[option.id || ""] ? (
                            <CircularProgress
                              size={15}
                              className="mr-2"
                            ></CircularProgress>
                          ) : (
                            ""
                          )}
                        </div>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  ) : (
    <div></div>
  );
};
