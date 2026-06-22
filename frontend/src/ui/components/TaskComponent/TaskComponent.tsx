"use client";
/*
 * Documentation:
 * Task component — https://app.subframe.com/0540066ac8f9/library?component=Task+component_d4cceeae-d2a4-498e-a2df-aec90f51fd15
 */

import React from "react";
import { FeatherInfo } from "@subframe/core";
import { FeatherPhone } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import * as SubframeUtils from "../../utils";

export interface TaskComponentRootProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  stepNumber?: React.ReactNode;
  category?: React.ReactNode;
  badge?: React.ReactNode;
  title?: React.ReactNode;
  headerIcon?: React.ReactNode;
  collapseButton?: React.ReactNode;
  suggestion?: React.ReactNode;
  reasonTags?: React.ReactNode;
  whyThisLabel?: React.ReactNode;
  highlight?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const TaskComponentRoot = React.forwardRef<
  HTMLDivElement,
  TaskComponentRootProps
>(function TaskComponentRoot(
  {
    stepNumber,
    category,
    badge,
    title,
    headerIcon = <FeatherPhone />,
    collapseButton,
    suggestion,
    reasonTags,
    whyThisLabel,
    highlight,
    actions,
    className,
    ...otherProps
  }: TaskComponentRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex w-full items-start gap-4",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      <div className="flex w-8 flex-none flex-col items-center self-stretch">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600">
          {stepNumber ? (
            <span className="text-body-bold font-body-bold text-white">
              {stepNumber}
            </span>
          ) : null}
        </div>
        <div className="flex w-0.5 grow shrink-0 basis-0 items-start rounded-full bg-brand-200" />
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 pb-6">
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {category ? (
                <span className="text-caption-bold font-caption-bold text-subtext-color">
                  {category}
                </span>
              ) : null}
              {badge ? (
                <div className="flex flex-wrap items-center gap-2">{badge}</div>
              ) : null}
            </div>
            <div className="flex w-full items-center gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-brand-100">
                {headerIcon ? (
                  <SubframeCore.IconWrapper className="text-heading-2 font-heading-2 text-brand-700">
                    {headerIcon}
                  </SubframeCore.IconWrapper>
                ) : null}
              </div>
              {title ? (
                <span className="grow shrink-0 basis-0 text-heading-2 font-heading-2 text-default-font">
                  {title}
                </span>
              ) : null}
            </div>
          </div>
          {collapseButton ? (
            <div className="flex flex-wrap items-start gap-4">
              {collapseButton}
            </div>
          ) : null}
        </div>
        {suggestion ? (
          <div className="flex w-full flex-col items-start">{suggestion}</div>
        ) : null}
        <div className="flex w-full flex-col items-start gap-2 rounded-md bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-1">
            <FeatherInfo className="text-caption font-caption text-subtext-color" />
            {whyThisLabel ? (
              <span className="text-caption-bold font-caption-bold text-subtext-color">
                {whyThisLabel}
              </span>
            ) : null}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            {reasonTags ? (
              <div className="flex flex-wrap items-center gap-2">
                {reasonTags}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-brand-200 bg-brand-50 px-4 py-3">
          {highlight ? (
            <div className="flex w-full flex-col items-start">{highlight}</div>
          ) : null}
          {actions ? (
            <div className="flex w-full flex-col items-start">{actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export const TaskComponent = TaskComponentRoot;
